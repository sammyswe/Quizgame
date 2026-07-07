import {
  ASSIGNABLE_MISSIONS,
  CHEST_SOURCES,
  FINAL_ACTIONS,
  ITEMS,
  MISSIONS,
  ROUNDS,
  SCORING,
  TIMING,
  applyDelta,
  buildRoundPlan,
  computeRanks,
  createChase,
  drawAuctionLot,
  ev,
  normaliseAllocation,
  offerFinalActions,
  openChest,
  pickObscureQuestion,
  pickQuestions,
  resolveBids,
  resolveFinalQuestion,
  resolveLootDrop,
  resolveObscure,
  resolvePair,
  resolveQuestion,
  stepChase,
  type ChestAward,
  type FinalActionId,
  type GameConfig,
  type ItemDef,
  type OwnedItem,
  type Phase,
  type PlunderChoice,
  type PublicGameState,
  type PublicPlayer,
  type PrivatePlayerState,
  type Question,
  type Rarity,
  type RevealEvent,
} from "@treasure-trap/shared";
import type { ServerPlayer, ServerRoom } from "./state.js";

/** Decouples the engine from socket.io. sockets.ts provides the implementation. */
export type Emitter = {
  broadcast: (room: ServerRoom) => void;
  toPlayer: (room: ServerRoom, playerId: string, event: string, payload: unknown) => void;
  toast: (room: ServerRoom, playerId: string | null, msg: { icon?: string; text: string }) => void;
  onBotPhase: (room: ServerRoom) => void;
};

let emitter: Emitter = {
  broadcast: () => {},
  toPlayer: () => {},
  toast: () => {},
  onBotPhase: () => {},
};

export function setEmitter(e: Emitter): void {
  emitter = e;
}

let uidCounter = 0;
export function uid(prefix = "id"): string {
  uidCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${uidCounter.toString(36)}`;
}

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

export function publicPlayers(room: ServerRoom): PublicPlayer[] {
  const scores: Record<string, number> = {};
  for (const p of room.players.values()) scores[p.id] = p.score + p.roundLoot;
  const ranks = computeRanks(scores);
  return [...room.players.values()].map((p) => ({
    id: p.id,
    nickname: p.nickname,
    avatar: p.avatar,
    isHost: p.id === room.hostId,
    isBot: p.isBot,
    connected: p.connected,
    score: p.score,
    roundLoot: p.roundLoot,
    chestCount: p.chests.length,
    itemCount: p.items.length,
    streak: p.streak,
    mutinyTokens: p.mutinyTokens,
    hasAnswered: room.answers.has(p.id),
    confident: room.answers.get(p.id)?.confident,
    rank: ranks[p.id] ?? 1,
  }));
}

export function publicState(room: ServerRoom): PublicGameState {
  const round = room.roundPlan[room.roundIndex];
  return {
    roomCode: room.code,
    phase: room.phase,
    config: room.config,
    roundPlan: room.roundPlan,
    roundIndex: room.roundIndex,
    currentRound: round,
    questionNumber: room.questionNumber,
    totalQuestionsInRound: round ? ROUNDS[round].questionsInRound : 0,
    question: room.currentObscure
      ? {
          id: room.currentObscure.id,
          category: "obscure",
          prompt: room.currentObscure.prompt,
          options: room.currentObscure.options.map((o) => o.text),
          difficulty: "hard",
        }
      : room.currentQuestion
        ? {
            id: room.currentQuestion.id,
            category: room.currentQuestion.category,
            prompt: room.currentQuestion.prompt,
            options: room.currentQuestion.options,
            difficulty: room.currentQuestion.difficulty,
          }
        : undefined,
    timerEndsAt: room.timerEndsAt,
    players: publicPlayers(room),
    revealEvents: room.phase === "reveal" ? room.revealEvents : [],
    auction: room.auction
      ? {
          prizeId: room.auction.lot.id,
          prizeName: room.auction.lot.name,
          prizeIcon: room.auction.lot.icon,
          prizeDescription: room.auction.lot.description,
          bidsIn: [...room.auction.bids.keys()],
        }
      : undefined,
    falseMap: room.falseMap ? { captainIds: room.falseMap.captainIds } : undefined,
    pairs: room.pairs,
    chase: room.chase,
    finalPlunder:
      room.roundPlan[room.roundIndex] === "finalPlunder" && room.phase !== "leaderboard"
        ? {
            questionNumber: room.questionNumber,
            totalQuestions: 3,
            actionsIn: [...room.players.values()].filter((p) => p.finalChoice).map((p) => p.id),
          }
        : undefined,
    winnerId: room.winnerId,
    ticker: room.ticker.slice(-6),
  };
}

export function privateState(room: ServerRoom, p: ServerPlayer): PrivatePlayerState {
  return {
    playerId: p.id,
    items: p.items,
    chests: p.chests,
    mission: p.mission ? { ...p.mission, def: MISSIONS[p.mission.missionId] } : undefined,
    disabledOptions: p.disabledOptions.length > 0 ? p.disabledOptions : undefined,
    privateClue: p.privateClue,
    finalActions: p.finalActionsOffered,
    answerLocked: p.answerLocked,
    chosenFinalAction: p.finalChoice?.actionId,
  };
}

// ---------------------------------------------------------------------------
// Phase machinery
// ---------------------------------------------------------------------------

function setPhase(
  room: ServerRoom,
  phase: Phase,
  durationMs: number,
  onTimeout?: () => void,
): void {
  if (room.timer) clearTimeout(room.timer);
  room.phase = phase;
  room.onPhaseEnd = onTimeout;
  room.timerEndsAt = durationMs > 0 ? Date.now() + durationMs : 0;
  room.timer = durationMs > 0 && onTimeout ? setTimeout(() => onTimeout(), durationMs) : undefined;
  emitter.broadcast(room);
  emitter.onBotPhase(room);
}

/** Host pressed "advance" or debug skipped the timer: run the scheduled continuation early. */
export function skipTimer(room: ServerRoom): void {
  const continuation = room.onPhaseEnd;
  if (!continuation) return;
  if (room.timer) clearTimeout(room.timer);
  room.timer = undefined;
  room.onPhaseEnd = undefined;
  continuation();
}

function ticker(room: ServerRoom, text: string): void {
  room.ticker.push(text);
  if (room.ticker.length > 20) room.ticker.shift();
}

// ---------------------------------------------------------------------------
// Game start / round sequencing
// ---------------------------------------------------------------------------

export function configureGame(room: ServerRoom, config: GameConfig): void {
  room.config = config;
  emitter.broadcast(room);
}

export function startGame(room: ServerRoom): void {
  room.roundPlan = buildRoundPlan(
    room.config.length,
    room.config.rounds.length > 0 ? room.config.rounds : undefined,
  );
  room.roundIndex = -1;
  for (const p of room.players.values()) {
    p.score = 0;
    p.roundLoot = 0;
    p.streak = 0;
    p.mutinyTokens = 1;
    p.items = [];
    p.chests = [];
    p.mission = undefined;
    resetQuestionState(p);
  }
  room.winnerId = undefined;
  nextRound(room);
}

export function resetToLobby(room: ServerRoom): void {
  if (room.timer) clearTimeout(room.timer);
  room.timer = undefined;
  room.roundPlan = [];
  room.roundIndex = -1;
  room.questionNumber = 0;
  room.currentQuestion = undefined;
  room.currentObscure = undefined;
  room.usedQuestionIds = new Set();
  room.answers = new Map();
  room.effects = [];
  room.accusations = [];
  room.pacts = [];
  room.auction = undefined;
  room.falseMap = undefined;
  room.pairs = undefined;
  room.chase = undefined;
  room.revealEvents = [];
  room.winnerId = undefined;
  room.ticker = [];
  room.underdogRounds = new Set();
  for (const p of room.players.values()) {
    p.score = 0;
    p.roundLoot = 0;
    p.streak = 0;
    p.mutinyTokens = 1;
    p.items = [];
    p.chests = [];
    p.mission = undefined;
    resetQuestionState(p);
  }
  setPhase(room, "lobby", 0);
}

function resetQuestionState(p: ServerPlayer): void {
  p.disabledOptions = [];
  p.answerLocked = false;
  p.privateClue = undefined;
  p.finalActionsOffered = undefined;
  p.finalChoice = undefined;
  p.pairChoice = undefined;
  p.doubleReward = false;
}

function nextRound(room: ServerRoom): void {
  // Bank all unbanked loot at the end of a round.
  for (const p of room.players.values()) {
    p.score = applyDelta(p.score, p.roundLoot).next;
    p.roundLoot = 0;
    p.mission = undefined;
    resetQuestionState(p);
  }
  room.effects = [];
  room.accusations = [];
  room.pacts = [];
  room.auction = undefined;
  room.falseMap = undefined;
  room.pairs = undefined;
  room.chase = undefined;

  room.roundIndex += 1;
  room.questionNumber = 0;
  const round = room.roundPlan[room.roundIndex];
  if (!round) {
    declareWinner(room);
    return;
  }
  ticker(room, `${ROUNDS[round].icon} ${ROUNDS[round].name} begins!`);
  setPhase(room, "round_intro", TIMING.ROUND_INTRO_MS, () => startQuestionCycle(room));
}

function declareWinner(room: ServerRoom): void {
  const players = publicPlayers(room);
  const winner = [...players].sort((a, b) => b.score + b.roundLoot - (a.score + a.roundLoot))[0];
  room.winnerId = winner?.id;
  ticker(room, `👑 ${winner?.nickname ?? "Nobody"} is the richest pirate!`);
  setPhase(room, "winner", 0);
}

// ---------------------------------------------------------------------------
// Question lifecycle
// ---------------------------------------------------------------------------

function drawQuestion(room: ServerRoom): Question {
  const [q] = pickQuestions(1, Math.random, room.usedQuestionIds);
  const question = q ?? pickQuestions(1)[0];
  if (!question) throw new Error("Question bank exhausted");
  room.usedQuestionIds.add(question.id);
  return question;
}

function beginQuestion(room: ServerRoom, durationMs: number): void {
  room.answers = new Map();
  room.accusations = [];
  for (const p of room.players.values()) {
    p.answerLocked = false;
    p.disabledOptions = [];
  }
  room.questionNumber += 1;
  setPhase(room, "question", durationMs, () => endQuestion(room));
}

function startQuestionCycle(room: ServerRoom): void {
  const round = room.roundPlan[room.roundIndex];
  if (!round) return;
  switch (round) {
    case "lootDrop":
      room.currentQuestion = drawQuestion(room);
      room.currentObscure = undefined;
      beginQuestion(room, TIMING.LOOT_DROP_MS);
      break;
    case "treasureAuction":
      startAuction(room);
      break;
    case "falseMap":
      startFalseMap(room);
      break;
    case "obscureIsland":
      room.currentObscure = pickObscureQuestion(Math.random, room.usedQuestionIds);
      room.usedQuestionIds.add(room.currentObscure.id);
      room.currentQuestion = undefined;
      beginQuestion(room, TIMING.QUESTION_MS);
      break;
    case "splitOrPlunder":
      startSplitOrPlunder(room);
      break;
    case "captainsChase":
      startChase(room);
      break;
    case "finalPlunder":
      startFinalPlunder(room);
      break;
  }
}

/** All human players answered → end early (small grace so it doesn't feel abrupt). */
export function maybeEndEarly(room: ServerRoom): void {
  if (room.phase !== "question") return;
  const everyoneIn = [...room.players.values()]
    .filter((p) => p.connected)
    .every((p) => room.answers.has(p.id));
  if (!everyoneIn) return;
  if (room.timer) clearTimeout(room.timer);
  room.timerEndsAt = Date.now() + 1500;
  emitter.broadcast(room);
  room.timer = setTimeout(() => endQuestion(room), 1500);
}

function endQuestion(room: ServerRoom): void {
  const round = room.roundPlan[room.roundIndex];
  if (!round) return;
  switch (round) {
    case "lootDrop":
      resolveLootDropQuestion(room);
      break;
    case "treasureAuction":
    case "falseMap":
      resolveStandardQuestion(room);
      break;
    case "obscureIsland":
      resolveObscureQuestion(room);
      break;
    case "splitOrPlunder":
      startPairChoice(room);
      break;
    case "captainsChase":
      resolveChaseQuestion(room);
      break;
    case "finalPlunder":
      resolveFinalPlunderQuestion(room);
      break;
  }
}

// ---------------------------------------------------------------------------
// Applying resolutions
// ---------------------------------------------------------------------------

function grantChest(room: ServerRoom, award: ChestAward): void {
  const player = room.players.get(award.playerId);
  if (!player) return;
  player.chests.push({ uid: uid("chest"), source: award.source, earnedAtRound: room.roundIndex });
}

function applyLootDelta(room: ServerRoom, delta: Record<string, number>): void {
  for (const [id, d] of Object.entries(delta)) {
    const p = room.players.get(id);
    if (!p) continue;
    // roundLoot can't push the combined total below zero.
    p.roundLoot = Math.max(-p.score, p.roundLoot + d);
    if (p.roundLoot + p.score < 0) p.roundLoot = -p.score;
  }
}

function startReveal(room: ServerRoom, events: RevealEvent[], after: () => void): void {
  room.revealEvents = events;
  const duration = Math.max(TIMING.REVEAL_MIN_MS, events.length * TIMING.REVEAL_STEP_MS + 1200);
  setPhase(room, "reveal", duration, after);
}

function afterReveal(room: ServerRoom): void {
  const round = room.roundPlan[room.roundIndex];
  if (!round) return;
  const meta = ROUNDS[round];
  const isChaseDone =
    round === "captainsChase" &&
    (room.chase === undefined ||
      room.chase.caughtBy !== undefined ||
      room.chase.questionNumber > room.chase.totalQuestions);
  if (round === "captainsChase" && !isChaseDone) {
    room.currentQuestion = drawQuestion(room);
    beginQuestion(room, TIMING.QUESTION_MS);
    return;
  }
  if (room.questionNumber < meta.questionsInRound && round !== "captainsChase") {
    // Next question within the round.
    if (round === "finalPlunder") {
      beginFinalActionPhase(room);
    } else {
      room.currentQuestion = drawQuestion(room);
      beginQuestion(room, round === "lootDrop" ? TIMING.LOOT_DROP_MS : TIMING.QUESTION_MS);
    }
    return;
  }
  showLeaderboard(room);
}

function showLeaderboard(room: ServerRoom): void {
  // Bank loot, hand out underdog checkpoint chest.
  for (const p of room.players.values()) {
    p.score = applyDelta(p.score, p.roundLoot).next;
    p.roundLoot = 0;
  }
  const ranked = publicPlayers(room).sort((a, b) => a.rank - b.rank);
  const last = ranked[ranked.length - 1];
  if (
    last &&
    ranked.length >= 3 &&
    !room.underdogRounds.has(room.roundIndex) &&
    room.roundIndex >= 1
  ) {
    room.underdogRounds.add(room.roundIndex);
    grantChest(room, { playerId: last.id, source: "underdog" });
    emitter.toast(room, last.id, {
      icon: "🐙",
      text: "Underdog Chest! The sea favours the desperate.",
    });
  }
  const isLastRound = room.roundIndex >= room.roundPlan.length - 1;
  if (isLastRound) {
    declareWinner(room);
    return;
  }
  setPhase(room, "leaderboard", TIMING.LEADERBOARD_MS, () => nextRound(room));
}

// ---------------------------------------------------------------------------
// Standard question resolution (auction + false map + chase steps reuse this core)
// ---------------------------------------------------------------------------

function buildResolveInputs(room: ServerRoom) {
  const ranks = computeRanks(
    Object.fromEntries([...room.players.values()].map((p) => [p.id, p.score + p.roundLoot])),
  );
  return [...room.players.values()].map((p) => ({
    id: p.id,
    nickname: p.nickname,
    score: p.score,
    roundLoot: p.roundLoot,
    rank: ranks[p.id] ?? 1,
    streak: p.streak,
    choiceIndex: room.answers.get(p.id)?.choiceIndex,
    mission: p.mission,
    hasAgentShield: p.agentShield,
    rumRush: p.rumRush,
    doubleReward: p.doubleReward,
  }));
}

function resolveStandardQuestion(room: ServerRoom, extraEvents: RevealEvent[] = []): void {
  const q = room.currentQuestion;
  if (!q) return;

  // Strongbox: players with lootProtected are immune to loot-touching attacks.
  const effects = room.effects.filter((e) => {
    const target = e.targetId ? room.players.get(e.targetId) : undefined;
    if (!target?.lootProtected) return true;
    return !["treasureSwitch", "shipwreck"].includes(e.itemId);
  });

  const res = resolveQuestion({
    correctIndex: q.correctIndex,
    players: buildResolveInputs(room),
    effects,
    accusations: room.accusations,
  });

  applyLootDelta(room, res.lootDelta);
  for (const award of res.chests) grantChest(room, award);
  for (const p of room.players.values()) {
    p.streak = res.streaks[p.id] ?? 0;
    if (res.rumRushConsumed.includes(p.id)) p.rumRush = false;
    if (res.missionSuccesses.includes(p.id)) p.mission = undefined;
  }
  // Fear Shot spent agent shields
  for (const e of room.effects.filter((x) => x.itemId === "fearShot")) {
    const t = e.targetId ? room.players.get(e.targetId) : undefined;
    if (t?.agentShield) t.agentShield = false;
  }
  room.effects = [];
  const falseMapEvents = buildFalseMapRevealEvents(room, q.correctIndex);
  startReveal(room, [...extraEvents, ...falseMapEvents, ...res.events], () => afterReveal(room));
}

// ---------------------------------------------------------------------------
// Round: Loot Drop
// ---------------------------------------------------------------------------

function resolveLootDropQuestion(room: ServerRoom): void {
  const q = room.currentQuestion;
  if (!q) return;
  const inputs = [...room.players.values()].map((p) => {
    const ans = room.answers.get(p.id);
    return {
      id: p.id,
      nickname: p.nickname,
      allocation: ans?.lootAllocation,
      confident: ans?.confident,
    };
  });
  const res = resolveLootDrop(inputs, q.correctIndex, room.pacts);
  applyLootDelta(room, res.lootDelta);
  for (const award of res.chests) grantChest(room, award);

  // Item effects still resolve in Loot Drop (backstab etc. use choiceIndex of biggest pile).
  for (const p of room.players.values()) {
    const ans = room.answers.get(p.id);
    if (ans && ans.choiceIndex === undefined && ans.lootAllocation) {
      const alloc = normaliseAllocation(ans.lootAllocation);
      const max = Math.max(...alloc);
      ans.choiceIndex = max > 0 ? alloc.indexOf(max) : undefined;
    }
  }
  const itemRes = resolveQuestion({
    correctIndex: q.correctIndex,
    players: buildResolveInputs(room).map((p) => ({ ...p, mission: undefined })),
    effects: room.effects,
    accusations: [],
    basePoints: 0, // island loot already scored; items only
  });
  // Drop the auto "+0 correct" noise events; keep item drama.
  const itemEvents = itemRes.events.filter(
    (e) => e.type !== "correctAnswer" && e.type !== "scoreChanged",
  );
  applyLootDelta(room, itemRes.lootDelta);
  for (const award of itemRes.chests) grantChest(room, award);
  for (const p of room.players.values()) {
    // Streak counts if most loot was on the right island.
    const ans = room.answers.get(p.id);
    p.streak = ans?.choiceIndex === q.correctIndex ? p.streak + 1 : 0;
  }
  room.effects = [];
  room.pacts = [];
  startReveal(room, [...res.events, ...itemEvents], () => afterReveal(room));
}

// ---------------------------------------------------------------------------
// Round: Treasure Auction
// ---------------------------------------------------------------------------

function startAuction(room: ServerRoom): void {
  room.auction = { lot: drawAuctionLot(), bids: new Map() };
  room.currentQuestion = undefined;
  room.currentObscure = undefined;
  setPhase(room, "auction", TIMING.AUCTION_MS, () => finishAuction(room));
}

export function submitBid(room: ServerRoom, playerId: string, amount: number): void {
  if (room.phase !== "auction" || !room.auction) return;
  const p = room.players.get(playerId);
  if (!p) return;
  const clamped = Math.max(0, Math.min(Math.floor(amount), p.score + p.roundLoot));
  room.auction.bids.set(playerId, { amount: clamped, at: Date.now() });
  emitter.broadcast(room);
  const everyoneIn = [...room.players.values()]
    .filter((x) => x.connected)
    .every((x) => room.auction?.bids.has(x.id));
  if (everyoneIn) {
    if (room.timer) clearTimeout(room.timer);
    room.timer = setTimeout(() => finishAuction(room), 1000);
    room.timerEndsAt = Date.now() + 1000;
    emitter.broadcast(room);
  }
}

function finishAuction(room: ServerRoom): void {
  if (!room.auction) return;
  const bids = [...room.auction.bids.entries()].map(([playerId, b]) => ({ playerId, ...b }));
  const result = resolveBids(bids);
  const events: RevealEvent[] = [];
  if (result) {
    const winner = room.players.get(result.winnerId);
    if (winner) {
      // Pay from loot first, then score.
      applyLootDelta(room, { [winner.id]: -result.amount });
      const lot = room.auction.lot;
      events.push(
        ev(
          "auctionResult",
          "SOLD! 🔨",
          `${winner.nickname} wins the ${lot.name} for ${result.amount} points!`,
          {
            icon: lot.icon,
            playerIds: [winner.id],
            pointsDelta: { [winner.id]: -result.amount },
          },
        ),
      );
      switch (lot.id) {
        case "mysteryChest":
          grantChest(room, { playerId: winner.id, source: "auction" });
          break;
        case "spyglass":
          winner.items.push({ uid: uid("item"), itemId: "spyglass" });
          break;
        case "doubleReward":
          winner.doubleReward = true;
          break;
        case "privateClue":
          // set when the question is drawn below
          winner.privateClue = "__PENDING__";
          break;
        case "protectLoot":
          winner.lootProtected = true;
          break;
        case "cursedLot":
          events.push(
            ev(
              "auctionResult",
              "It was SAND. ✨",
              `${winner.nickname} opens the glittering crate... sand. Beautiful, worthless sand.`,
              {
                icon: "🏖️",
                playerIds: [winner.id],
              },
            ),
          );
          break;
      }
    }
  } else {
    events.push(
      ev(
        "auctionResult",
        "No bids!",
        "The auctioneer sighs and closes the lot. Cowards, all of you.",
        { icon: "🔨" },
      ),
    );
  }

  // Draw the question, deliver clue if bought, then play it.
  room.currentQuestion = drawQuestion(room);
  for (const p of room.players.values()) {
    if (p.privateClue === "__PENDING__") {
      const q = room.currentQuestion;
      const correct = q.options[q.correctIndex];
      const wrong = q.options.filter((_, i) => i !== q.correctIndex)[0];
      p.privateClue = `🤫 The informant whispers: "It's either ${correct} or ${wrong}..."`;
    }
  }
  const auctionRecap = events;
  room.auction = undefined;
  // Show auction outcome as a short reveal, then the question starts.
  room.revealEvents = auctionRecap;
  setPhase(
    room,
    "reveal",
    Math.max(TIMING.REVEAL_MIN_MS, auctionRecap.length * TIMING.REVEAL_STEP_MS),
    () => beginQuestion(room, TIMING.QUESTION_MS),
  );
}

// ---------------------------------------------------------------------------
// Round: False Map
// ---------------------------------------------------------------------------

function startFalseMap(room: ServerRoom): void {
  room.currentQuestion = drawQuestion(room);
  const q = room.currentQuestion;
  const ids = [...room.players.keys()];
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  const trueCaptainId = shuffled[0];
  const falseCaptainId = shuffled[1];
  if (trueCaptainId && falseCaptainId) {
    room.falseMap = {
      captainIds: [trueCaptainId, falseCaptainId].sort(() => Math.random() - 0.5),
      trueCaptainId,
    };
    const trueCap = room.players.get(trueCaptainId);
    const falseCap = room.players.get(falseCaptainId);
    if (trueCap) {
      trueCap.privateClue = `🧭 YOUR MAP IS TRUE. The answer is "${q.options[q.correctIndex]}". Convince the crew — or keep it to yourself.`;
    }
    if (falseCap) {
      const wrongIndex = q.options.findIndex((_, i) => i !== q.correctIndex);
      falseCap.privateClue = `🗺️ YOUR MAP IS FALSE. Sell the crew on "${q.options[wrongIndex]}" (it's WRONG — but they don't know that). You still score by answering correctly yourself...`;
    }
  }
  // Everyone gets a secret mission.
  for (const p of room.players.values()) {
    assignMission(room, p);
  }
  beginQuestion(room, TIMING.QUESTION_MS);
}

function assignMission(room: ServerRoom, p: ServerPlayer): void {
  const pool = ASSIGNABLE_MISSIONS.filter((m) => {
    // Snake Oil needs a leader that isn't you.
    if (m === "snakeOil") {
      const leader = publicPlayers(room).sort((a, b) => a.rank - b.rank)[0];
      return leader ? leader.id !== p.id : false;
    }
    return true;
  });
  const missionId = pool[Math.floor(Math.random() * pool.length)];
  if (!missionId) return;
  p.mission = { missionId };
  emitter.toPlayer(room, p.id, "toast", {
    icon: MISSIONS[missionId].icon,
    text: `Secret mission: ${MISSIONS[missionId].name}`,
  });
}

export function setupMission(
  room: ServerRoom,
  playerId: string,
  payload: { targetId?: string; optionIndex?: number },
): void {
  const p = room.players.get(playerId);
  if (!p?.mission) return;
  const def = MISSIONS[p.mission.missionId];
  if (def.needsTarget && payload.targetId && payload.targetId !== playerId) {
    p.mission.targetId = payload.targetId;
  }
  if (def.needsOption && payload.optionIndex !== undefined) {
    p.mission.optionIndex = payload.optionIndex;
  }
  emitter.broadcast(room);
}

function buildFalseMapRevealEvents(room: ServerRoom, correctIndex: number): RevealEvent[] {
  if (!room.falseMap || !room.currentQuestion) return [];
  const trueCap = room.players.get(room.falseMap.trueCaptainId);
  const falseCapId = room.falseMap.captainIds.find((id) => id !== room.falseMap?.trueCaptainId);
  const falseCap = falseCapId ? room.players.get(falseCapId) : undefined;
  const events: RevealEvent[] = [];
  if (trueCap && falseCap) {
    events.push(
      ev(
        "correctAnswer",
        "The maps are unrolled! 🗺️",
        `${trueCap.nickname} held the TRUE map. ${falseCap.nickname}'s map was FAKE. Who did you follow?`,
        { icon: "🗺️", playerIds: [trueCap.id, falseCap.id] },
      ),
    );
  }
  void correctIndex;
  room.falseMap = undefined;
  return events;
}

export function accuse(room: ServerRoom, accuserId: string, accusedId: string): void {
  const accuser = room.players.get(accuserId);
  const accused = room.players.get(accusedId);
  if (!accuser || !accused || accuserId === accusedId) return;
  if (room.phase !== "question") return;
  if (accuser.mutinyTokens <= 0) {
    emitter.toPlayer(room, accuserId, "error", "No mutiny tokens left!");
    return;
  }
  if (room.accusations.some((a) => a.accuserId === accuserId)) return;
  accuser.mutinyTokens -= 1;
  room.accusations.push({ accuserId, accusedId });
  ticker(room, `⚔️ ${accuser.nickname} points the finger at ${accused.nickname}! MUTINY brews...`);
  emitter.broadcast(room);
}

// ---------------------------------------------------------------------------
// Round: Obscure Island
// ---------------------------------------------------------------------------

function resolveObscureQuestion(room: ServerRoom): void {
  const q = room.currentObscure;
  if (!q) return;
  const inputs = [...room.players.values()].map((p) => ({
    id: p.id,
    nickname: p.nickname,
    choiceIndex: room.answers.get(p.id)?.choiceIndex,
  }));
  const res = resolveObscure(inputs, q);
  applyLootDelta(room, res.lootDelta);
  for (const award of res.chests) grantChest(room, award);
  room.currentObscure = undefined;
  room.effects = [];
  startReveal(room, res.events, () => afterReveal(room));
}

// ---------------------------------------------------------------------------
// Round: Split or Plunder
// ---------------------------------------------------------------------------

function startSplitOrPlunder(room: ServerRoom): void {
  const ids = [...room.players.keys()].sort(() => Math.random() - 0.5);
  const pairs = [];
  for (let i = 0; i + 1 < ids.length; i += 2) {
    pairs.push({ aId: ids[i] as string, bId: ids[i + 1] as string, potSize: SCORING.POT_BASE });
  }
  // Odd player out joins the last pair as a spectator-earner (simplified: solo pot).
  if (ids.length % 2 === 1) {
    const solo = ids[ids.length - 1];
    if (solo && pairs.length > 0) {
      // solo player answers for a flat reward; treated as its own "pair" vs nobody
      pairs.push({ aId: solo, bId: solo, potSize: SCORING.POT_BASE / 2 });
    }
  }
  room.pairs = pairs;
  room.currentQuestion = drawQuestion(room);
  beginQuestion(room, TIMING.QUESTION_MS);
}

function startPairChoice(room: ServerRoom): void {
  const q = room.currentQuestion;
  if (!q || !room.pairs) return;
  // Only pairs where both are correct face the dilemma; still give everyone the choice screen for tension.
  setPhase(room, "pair_choice", TIMING.PAIR_CHOICE_MS, () => resolveSplitOrPlunder(room));
}

export function submitPairChoice(room: ServerRoom, playerId: string, choice: PlunderChoice): void {
  if (room.phase !== "pair_choice") return;
  const p = room.players.get(playerId);
  if (!p) return;
  p.pairChoice = choice;
  emitter.broadcast(room);
  const everyoneIn = [...room.players.values()]
    .filter((x) => x.connected)
    .every((x) => x.pairChoice);
  if (everyoneIn) {
    if (room.timer) clearTimeout(room.timer);
    room.timer = setTimeout(() => resolveSplitOrPlunder(room), 800);
  }
}

function resolveSplitOrPlunder(room: ServerRoom): void {
  const q = room.currentQuestion;
  if (!q || !room.pairs) return;
  const events: RevealEvent[] = [];
  for (const pair of room.pairs) {
    const a = room.players.get(pair.aId);
    const b = room.players.get(pair.bId);
    if (!a || !b) continue;
    if (pair.aId === pair.bId) {
      // Odd player out: solo treasure hunt.
      const correct = room.answers.get(a.id)?.choiceIndex === q.correctIndex;
      if (correct) {
        applyLootDelta(room, { [a.id]: pair.potSize });
        events.push(
          ev(
            "pairResult",
            "Lone wolf eats!",
            `${a.nickname} had no partner and quietly pockets +${pair.potSize}.`,
            {
              icon: "🐺",
              playerIds: [a.id],
              pointsDelta: { [a.id]: pair.potSize },
            },
          ),
        );
      }
      continue;
    }
    const res = resolvePair(
      {
        id: a.id,
        nickname: a.nickname,
        correct: room.answers.get(a.id)?.choiceIndex === q.correctIndex,
        choice: a.pairChoice,
      },
      {
        id: b.id,
        nickname: b.nickname,
        correct: room.answers.get(b.id)?.choiceIndex === q.correctIndex,
        choice: b.pairChoice,
      },
    );
    applyLootDelta(room, res.lootDelta);
    for (const award of res.chests) grantChest(room, award);
    events.push(...res.events);
  }
  room.pairs = undefined;
  room.effects = [];
  startReveal(room, events, () => afterReveal(room));
}

// ---------------------------------------------------------------------------
// Round: Captain's Chase
// ---------------------------------------------------------------------------

function startChase(room: ServerRoom): void {
  const ranked = publicPlayers(room).sort((a, b) => a.rank - b.rank);
  const captainId = ranked[0]?.id;
  if (!captainId) return;
  const chaserIds = ranked.slice(1).map((p) => p.id);
  room.chase = createChase(captainId, chaserIds);
  room.currentQuestion = drawQuestion(room);
  beginQuestion(room, TIMING.QUESTION_MS);
}

function resolveChaseQuestion(room: ServerRoom): void {
  const q = room.currentQuestion;
  if (!q || !room.chase) return;
  const correctIds = new Set(
    [...room.players.values()]
      .filter((p) => room.answers.get(p.id)?.choiceIndex === q.correctIndex)
      .map((p) => p.id),
  );
  const nicknames = Object.fromEntries([...room.players.values()].map((p) => [p.id, p.nickname]));
  const captain = room.players.get(room.chase.captainId);
  const captainPool = captain ? captain.score + captain.roundLoot : 0;
  const result = stepChase(room.chase, correctIds, nicknames, captainPool);
  room.chase = result.chase;
  if (result.finished) {
    room.chase.questionNumber = room.chase.totalQuestions + 1;
  }
  applyLootDelta(room, result.lootDelta);
  // Streaks still tick in the chase.
  for (const p of room.players.values()) {
    p.streak = correctIds.has(p.id) ? p.streak + 1 : 0;
  }
  room.effects = [];
  startReveal(room, result.events, () => afterReveal(room));
}

// ---------------------------------------------------------------------------
// Round: Final Plunder
// ---------------------------------------------------------------------------

function startFinalPlunder(room: ServerRoom): void {
  // Bank everything: the Final Plunder plays with protected/unprotected TOTAL score.
  for (const p of room.players.values()) {
    p.score = applyDelta(p.score, p.roundLoot).next;
    p.roundLoot = 0;
  }
  beginFinalActionPhase(room);
}

function beginFinalActionPhase(room: ServerRoom): void {
  const ranks = computeRanks(
    Object.fromEntries([...room.players.values()].map((p) => [p.id, p.score])),
  );
  const playerCount = room.players.size;
  for (const p of room.players.values()) {
    p.finalChoice = undefined;
    p.finalActionsOffered = offerFinalActions(ranks[p.id] ?? playerCount, playerCount);
  }
  setPhase(room, "final_action", TIMING.FINAL_ACTION_MS, () => startFinalQuestion(room));
}

export function submitFinalAction(
  room: ServerRoom,
  playerId: string,
  payload: { actionId: FinalActionId; targetId?: string },
): void {
  if (room.phase !== "final_action") return;
  const p = room.players.get(playerId);
  if (!p || !p.finalActionsOffered?.includes(payload.actionId)) return;
  const def = FINAL_ACTIONS[payload.actionId];
  if (def.needsTarget && (!payload.targetId || payload.targetId === playerId)) return;
  p.finalChoice = { actionId: payload.actionId, targetId: payload.targetId };
  emitter.broadcast(room);
  const everyoneIn = [...room.players.values()]
    .filter((x) => x.connected)
    .every((x) => x.finalChoice);
  if (everyoneIn) {
    if (room.timer) clearTimeout(room.timer);
    room.timer = setTimeout(() => startFinalQuestion(room), 800);
  }
}

function startFinalQuestion(room: ServerRoom): void {
  // Default anyone without an action to something sensible & non-targeted.
  for (const p of room.players.values()) {
    if (!p.finalChoice) {
      const fallback =
        p.finalActionsOffered?.find((a) => !FINAL_ACTIONS[a].needsTarget) ?? "bankTheBooty";
      p.finalChoice = { actionId: fallback };
    }
    if (p.finalChoice.actionId === "spyTheDeck") {
      // handled once the question is drawn
    }
  }
  room.currentQuestion = drawQuestion(room);
  const q = room.currentQuestion;
  for (const p of room.players.values()) {
    if (p.finalChoice?.actionId === "spyTheDeck") {
      const wrong = q.options.map((_, i) => i).filter((i) => i !== q.correctIndex);
      const remove = wrong[Math.floor(Math.random() * wrong.length)];
      if (remove !== undefined) p.disabledOptions = [remove];
    }
  }
  beginQuestion(room, TIMING.QUESTION_MS);
}

function resolveFinalPlunderQuestion(room: ServerRoom): void {
  const q = room.currentQuestion;
  if (!q) return;
  const ranks = computeRanks(
    Object.fromEntries([...room.players.values()].map((p) => [p.id, p.score])),
  );
  const res = resolveFinalQuestion({
    correctIndex: q.correctIndex,
    players: [...room.players.values()].map((p) => ({
      id: p.id,
      nickname: p.nickname,
      score: p.score,
      rank: ranks[p.id] ?? 1,
      choiceIndex: room.answers.get(p.id)?.choiceIndex,
      action: p.finalChoice,
    })),
  });
  for (const [id, delta] of Object.entries(res.scoreDelta)) {
    const p = room.players.get(id);
    if (p) p.score = applyDelta(p.score, delta).next;
  }
  room.effects = [];
  const isLast = room.questionNumber >= 3;
  startReveal(room, res.events, () => {
    if (isLast) {
      declareWinner(room);
    } else {
      beginFinalActionPhase(room);
    }
  });
}

// ---------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------

export function submitAnswer(
  room: ServerRoom,
  playerId: string,
  payload: { choiceIndex?: number; lootAllocation?: number[]; confident?: boolean },
): void {
  if (room.phase !== "question") return;
  const p = room.players.get(playerId);
  if (!p) return;
  if (p.answerLocked && room.answers.has(playerId)) return;
  room.answers.set(playerId, {
    playerId,
    choiceIndex: payload.choiceIndex,
    lootAllocation: payload.lootAllocation
      ? normaliseAllocation(payload.lootAllocation)
      : undefined,
    confident: payload.confident,
    lockedAt: Date.now(),
  });
  emitter.broadcast(room);
  maybeEndEarly(room);
}

// ---------------------------------------------------------------------------
// Items & chests
// ---------------------------------------------------------------------------

export function useItem(
  room: ServerRoom,
  playerId: string,
  payload: { uid: string; targetId?: string; optionIndex?: number },
): void {
  const p = room.players.get(playerId);
  if (!p) return;
  const idx = p.items.findIndex((i) => i.uid === payload.uid);
  if (idx === -1) return;
  const item = p.items[idx];
  if (!item) return;
  const def = ITEMS[item.itemId];
  if (room.phase !== "question") {
    emitter.toPlayer(room, playerId, "error", "Items can only be played during a question.");
    return;
  }
  if (def.target === "otherPlayer" || def.target === "higherRanked") {
    if (!payload.targetId || payload.targetId === playerId || !room.players.has(payload.targetId)) {
      emitter.toPlayer(room, playerId, "error", "Pick a target for this item.");
      return;
    }
  }
  if (def.target === "higherRanked" && payload.targetId) {
    const ranks = computeRanks(
      Object.fromEntries([...room.players.values()].map((x) => [x.id, x.score + x.roundLoot])),
    );
    if ((ranks[payload.targetId] ?? 99) >= (ranks[playerId] ?? 99)) {
      emitter.toPlayer(
        room,
        playerId,
        "error",
        "Broadside Duel can only challenge a pirate ranked above you.",
      );
      return;
    }
  }
  if (def.target === "wrongOption" && payload.optionIndex === undefined) {
    emitter.toPlayer(room, playerId, "error", "Pick an answer to trap.");
    return;
  }

  p.items.splice(idx, 1);

  switch (item.itemId) {
    case "spyglass": {
      const q = room.currentQuestion;
      if (q) {
        const wrong = q.options
          .map((_, i) => i)
          .filter((i) => i !== q.correctIndex && !p.disabledOptions.includes(i));
        const remove = wrong[Math.floor(Math.random() * wrong.length)];
        if (remove !== undefined) p.disabledOptions = [...p.disabledOptions, remove];
      } else if (room.currentObscure) {
        const q2 = room.currentObscure;
        const wrong = q2.options
          .map((o, i) => ({ o, i }))
          .filter((x) => !x.o.correct && !p.disabledOptions.includes(x.i));
        const remove = wrong[Math.floor(Math.random() * wrong.length)]?.i;
        if (remove !== undefined) p.disabledOptions = [...p.disabledOptions, remove];
      }
      emitter.toPlayer(room, playerId, "toast", {
        icon: "🔭",
        text: "The spyglass reveals a false island!",
      });
      break;
    }
    case "rumRush":
      p.rumRush = true;
      emitter.toPlayer(room, playerId, "toast", {
        icon: "🍾",
        text: "Rum Rush! Next correct answer pays DOUBLE.",
      });
      break;
    case "doubleAgent":
      p.agentShield = true;
      assignMission(room, p);
      emitter.toPlayer(room, playerId, "toast", {
        icon: "🎭",
        text: "You are now a Double Agent. New mission received.",
      });
      break;
    case "sabotage": {
      const target = room.players.get(payload.targetId ?? "");
      if (target) {
        room.effects.push({
          uid: uid("fx"),
          itemId: item.itemId,
          byId: playerId,
          targetId: payload.targetId,
        });
        setTimeout(() => {
          target.answerLocked = true;
          // If they haven't answered, lock in a random choice — the rigging is tangled!
          if (!room.answers.has(target.id) && room.phase === "question") {
            const optionCount =
              room.currentQuestion?.options.length ?? room.currentObscure?.options.length ?? 4;
            room.answers.set(target.id, {
              playerId: target.id,
              choiceIndex: Math.floor(Math.random() * optionCount),
              lockedAt: Date.now(),
            });
          }
          emitter.toPlayer(room, target.id, "toast", {
            icon: "🪢",
            text: "SABOTAGE! Your answer is locked!",
          });
          emitter.broadcast(room);
          maybeEndEarly(room);
        }, TIMING.SABOTAGE_LOCK_DELAY_MS);
        emitter.toPlayer(room, target.id, "toast", {
          icon: "🪢",
          text: "Someone is tangling your rigging — your answer locks in 5 seconds!",
        });
      }
      break;
    }
    default:
      // Deferred effects resolve at the reveal.
      room.effects.push({
        uid: uid("fx"),
        itemId: item.itemId,
        byId: playerId,
        targetId: payload.targetId,
        optionIndex: payload.optionIndex,
      });
      break;
  }
  ticker(room, `✨ ${p.nickname} played a mystery item...`);
  emitter.broadcast(room);
}

export function openChestForPlayer(room: ServerRoom, playerId: string, chestUid: string): void {
  const p = room.players.get(playerId);
  if (!p) return;
  const idx = p.chests.findIndex((c) => c.uid === chestUid);
  if (idx === -1) return;
  if (room.phase === "reveal") {
    emitter.toPlayer(room, playerId, "error", "Wait for the reveal to finish, greedy.");
    return;
  }
  p.chests.splice(idx, 1);
  const ranks = computeRanks(
    Object.fromEntries([...room.players.values()].map((x) => [x.id, x.score + x.roundLoot])),
  );
  const { rarity, itemId } = openChest(ranks[playerId] ?? room.players.size, room.players.size);
  const owned: OwnedItem = { uid: uid("item"), itemId };
  p.items.push(owned);
  const def: ItemDef = ITEMS[itemId];
  emitter.toPlayer(room, playerId, "chest:opened", {
    uid: chestUid,
    rarity,
    item: owned,
    itemDef: def,
  });
  ticker(room, `🎁 ${p.nickname} opened a chest...`);
  emitter.broadcast(room);
}

export function forceChest(room: ServerRoom, playerId: string, _rarity?: Rarity): void {
  grantChest(room, { playerId, source: "debug" });
  const p = room.players.get(playerId);
  if (p)
    emitter.toast(room, playerId, {
      icon: "🧪",
      text: `Debug chest granted (${CHEST_SOURCES.debug.name})`,
    });
  emitter.broadcast(room);
}

// ---------------------------------------------------------------------------
// Pacts
// ---------------------------------------------------------------------------

export function offerPact(room: ServerRoom, fromId: string, toId: string): void {
  if (room.phase !== "question") return;
  if (fromId === toId || !room.players.has(toId)) return;
  if (room.pacts.some((x) => x.fromId === fromId)) return;
  room.pacts.push({ fromId, toId, accepted: false });
  const from = room.players.get(fromId);
  emitter.toPlayer(room, toId, "toast", {
    icon: "🤝",
    text: `${from?.nickname} offers a trust pact! Accept to share fates.`,
  });
  emitter.broadcast(room);
}

export function acceptPact(room: ServerRoom, playerId: string, fromId: string): void {
  const pact = room.pacts.find((x) => x.fromId === fromId && x.toId === playerId && !x.accepted);
  if (!pact) return;
  pact.accepted = true;
  ticker(room, `🤝 A trust pact was sealed...`);
  emitter.broadcast(room);
}

// ---------------------------------------------------------------------------
// Host / phase control
// ---------------------------------------------------------------------------

export function hostAdvance(room: ServerRoom, playerId: string): void {
  if (playerId !== room.hostId) return;
  if (room.phase === "winner") {
    resetToLobby(room);
    return;
  }
  skipTimer(room);
}

export { setPhase };

// Re-export for sockets/bots convenience.
export type { ServerRoom };
