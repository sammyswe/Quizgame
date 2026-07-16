import {
  ARCADE,
  ARCADE_LENGTHS,
  POWERUPS,
  SPECIAL_EVENTS,
  TIMING,
  applyDelta,
  computeRanks,
  eventForRound,
  eventRounds,
  ev,
  normaliseAllocation,
  oddsForRank,
  pickQuestions,
  pickQuestionBiomes,
  resolveArcadeQuestion,
  resolveLootDrop,
  rollIslandLoot,
  rollPowerUp,
  rollRarity,
  type ChestAward,
  type GameConfig,
  type OwnedPowerUp,
  type Phase,
  type PowerUpDef,
  type PublicGameState,
  type PublicPlayer,
  type PrivatePlayerState,
  type Question,
  type QuestionResult,
  type Rarity,
  type RevealEvent,
} from "@treasure-trap/shared";
import type { ServerPlayer, ServerRoom } from "./state.js";

/** Decouples the engine from socket.io. sockets.ts provides the implementation. */
export type Emitter = {
  broadcast: (room: ServerRoom) => void;
  toPlayer: (room: ServerRoom, playerId: string, event: string, payload: unknown) => void;
  toRoom: (room: ServerRoom, event: string, payload: unknown) => void;
  toast: (room: ServerRoom, playerId: string | null, msg: { icon?: string; text: string }) => void;
  onBotPhase: (room: ServerRoom) => void;
};

let emitter: Emitter = {
  broadcast: () => {},
  toPlayer: () => {},
  toRoom: () => {},
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

function ranksNow(room: ServerRoom): Record<string, number> {
  return computeRanks(
    Object.fromEntries([...room.players.values()].map((p) => [p.id, p.score])),
  );
}

function leaderIdNow(room: ServerRoom): string | undefined {
  const ranks = ranksNow(room);
  return [...room.players.keys()].find((id) => ranks[id] === 1);
}

export function publicPlayers(room: ServerRoom): PublicPlayer[] {
  const ranks = ranksNow(room);
  return [...room.players.values()].map((p) => ({
    id: p.id,
    nickname: p.nickname,
    monogram: p.monogram,
    avatar: p.avatar,
    isHost: p.id === room.hostId,
    isBot: p.isBot,
    connected: p.connected,
    score: p.score,
    roundLoot: 0,
    chestCount: p.chests.length,
    itemCount: p.powerUps.length,
    powerUpIds: p.powerUps.map((item) => item.powerUpId),
    activePowerUpEffects: [
      ...(p.rumRush ? (["rumRush"] as const) : []),
      ...(p.cannonballed ? (["cannonball"] as const) : []),
      ...(p.plankUntil ? (["walkThePlank"] as const) : []),
      ...(p.parrotTargetId ? (["parrot"] as const) : []),
      ...(p.whiteFlagged ? (["whiteFlag"] as const) : []),
    ],
    streak: p.streak,
    mutinyTokens: 0,
    hasAnswered: room.answers.has(p.id),
    rank: ranks[p.id] ?? 1,
    marooned: p.marooned,
  }));
}

export function publicState(room: ServerRoom): PublicGameState {
  return {
    roomCode: room.code,
    phase: room.phase,
    config: room.config,
    roundPlan: [],
    roundIndex: room.roundNumber - 1,
    currentRound: undefined,
    questionNumber: room.roundNumber,
    totalQuestionsInRound: 1,
    question: room.currentQuestion
      ? {
          id: room.currentQuestion.id,
          category: room.currentQuestion.category,
          prompt: room.currentQuestion.prompt,
          options: room.currentQuestion.options,
          difficulty: room.currentQuestion.difficulty,
          biomes: room.islandBiomes,
        }
      : undefined,
    timerEndsAt: room.timerEndsAt,
    players: publicPlayers(room),
    revealEvents: room.phase === "reveal" ? room.revealEvents : [],
    arcadeReveal:
      room.phase === "reveal" && room.currentQuestion
        ? {
            correctIndex: room.currentQuestion.correctIndex,
            islandLoot: room.islandLoot,
            answers: [...room.answers.values()].map((answer) => ({
              playerId: answer.playerId,
              choiceIndex: answer.choiceIndex,
              lootAllocation: answer.lootAllocation,
              lockedAt: answer.lockedAt,
            })),
          }
        : undefined,
    arcade:
      room.roundNumber > 0
        ? {
            roundNumber: room.roundNumber,
            totalRounds: room.totalRounds,
            isEventRound: room.isEventRound,
            eventId: room.eventId,
            questionStartedAt: room.questionStartedAt,
            questionDurationMs: room.questionDurationMs,
            potMax: ARCADE.POT_MAX,
            potMin: ARCADE.POT_MIN,
            firstFiveEarned: [...room.players.values()]
              .filter((p) => p.jackpotEarned)
              .map((p) => p.id),
            maroonedIds: [...room.players.values()].filter((p) => p.marooned).map((p) => p.id),
            leaderId: leaderIdNow(room),
            eventRounds: eventRounds(room.totalRounds),
          }
        : undefined,
    winnerId: room.winnerId,
    ticker: room.ticker.slice(-6),
  };
}

export function privateState(room: ServerRoom, p: ServerPlayer): PrivatePlayerState {
  return {
    playerId: p.id,
    items: [],
    powerUps: p.powerUps,
    chests: p.chests,
    hasMutinied: p.mutinied || undefined,
    revealedAnswerIndex: p.revealedAnswerIndex,
    parrotTargetId: p.parrotTargetId,
    horizon: p.telescopeTargetId
      ? (() => {
          const target = room.players.get(p.telescopeTargetId);
          const answer = room.answers.get(p.telescopeTargetId);
          return target
            ? answer?.choiceIndex === undefined
              ? `${target.nickname} has not committed a course yet.`
              : `${target.nickname} committed to island ${String.fromCharCode(65 + answer.choiceIndex)}.`
            : undefined;
        })()
      : p.horizon,
    cannonballed: p.cannonballed || undefined,
    plankUntil: p.plankUntil,
    lootDropPool: room.isEventRound ? p.eventWager : undefined,
    selectedChoiceIndex: room.answers.get(p.id)?.choiceIndex,
    lootAllocation: room.answers.get(p.id)?.lootAllocation,
    disabledOptions: p.disabledOptions.length > 0 ? p.disabledOptions : undefined,
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

function resetPlayerForGame(p: ServerPlayer): void {
  p.score = 0;
  p.streak = 0;
  p.powerUps = [];
  p.chests = [];
  p.jackpotEarned = false;
  p.blockLoot = 0;
  p.eventWager = 0;
  p.poseidonUsed = false;
  p.marooned = false;
  p.maroonPending = false;
  resetQuestionState(p);
}

function resetQuestionState(p: ServerPlayer): void {
  p.mutinied = false;
  p.disabledOptions = [];
  p.revealedAnswerIndex = undefined;
  p.parrotTargetId = undefined;
  p.telescopeTargetId = undefined;
  p.cannonballed = false;
  p.plankUntil = undefined;
  p.whiteFlagged = false;
}

export function startGame(room: ServerRoom): void {
  room.totalRounds = ARCADE_LENGTHS[room.config.length].rounds;
  room.roundNumber = 0;
  room.specialsPlayed = 0;
  room.usedQuestionIds = new Set();
  room.winnerId = undefined;
  for (const p of room.players.values()) resetPlayerForGame(p);
  nextArcadeRound(room);
}

export function resetToLobby(room: ServerRoom): void {
  if (room.timer) clearTimeout(room.timer);
  room.timer = undefined;
  room.roundNumber = 0;
  room.specialsPlayed = 0;
  room.currentQuestion = undefined;
  room.usedQuestionIds = new Set();
  room.answers = new Map();
  room.swordFights = [];
  room.revealEvents = [];
  room.winnerId = undefined;
  room.ticker = [];
  for (const p of room.players.values()) resetPlayerForGame(p);
  setPhase(room, "lobby", 0);
}

function nextArcadeRound(room: ServerRoom): void {
  const completedBlocks = Math.floor(room.roundNumber / ARCADE.EVENT_EVERY);
  if (completedBlocks > room.specialsPlayed) {
    room.specialsPlayed += 1;
    room.isEventRound = true;
    room.eventId = eventForRound(room.roundNumber);
    for (const p of room.players.values()) {
      p.eventWager = Math.floor(Math.min(p.score, p.blockLoot) / 10) * 10;
    }
    const meta = SPECIAL_EVENTS[room.eventId ?? "millionPoundDrop"];
    ticker(room, `${meta.icon} SPECIAL EVENT: ${meta.name}!`);
    setPhase(room, "round_intro", TIMING.ROUND_INTRO_MS, () => beginArcadeQuestion(room));
    return;
  }
  if (room.roundNumber >= room.totalRounds) {
    declareWinner(room);
    return;
  }
  room.roundNumber += 1;
  room.isEventRound = false;
  room.eventId = undefined;
  if (room.roundNumber === 1) {
    ticker(room, `The voyage begins — ${room.totalRounds} questions across the Seven Seas.`);
    setPhase(room, "round_intro", TIMING.ARCADE_INTRO_MS, () => beginArcadeQuestion(room));
    return;
  }
  beginArcadeQuestion(room);
}

function declareWinner(room: ServerRoom): void {
  const players = publicPlayers(room);
  const winner = [...players].sort((a, b) => b.score - a.score)[0];
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

function beginArcadeQuestion(room: ServerRoom): void {
  // Special rounds never consume a maroon skip; defer it to the next regular question.
  for (const p of room.players.values()) {
    if (room.isEventRound) {
      p.marooned = false;
    } else {
      p.marooned = p.maroonPending;
      p.maroonPending = false;
    }
    resetQuestionState(p);
  }
  room.answers = new Map();
  room.swordFights = [];
  room.currentQuestion = drawQuestion(room);
  room.islandBiomes = pickQuestionBiomes();
  room.islandLoot = rollIslandLoot();
  room.questionDurationMs = room.isEventRound ? TIMING.ARCADE_EVENT_MS : TIMING.ARCADE_QUESTION_MS;
  room.questionStartedAt = Date.now();
  for (const p of room.players.values()) {
    if (p.marooned) {
      emitter.toPlayer(room, p.id, "toast", {
        icon: "🏝️",
        text: "You're marooned — sit this one out.",
      });
    }
  }
  setPhase(room, "question", room.questionDurationMs, () => endArcadeQuestion(room));
}

/** Everyone who CAN answer has answered → end early with a short grace. */
export function maybeEndEarly(room: ServerRoom): void {
  if (room.phase !== "question") return;
  const everyoneIn = [...room.players.values()]
    .filter((p) => p.connected && !p.marooned)
    .filter((p) => !p.mutinied)
    .filter((p) => !p.whiteFlagged)
    .every((p) => room.answers.has(p.id));
  if (!everyoneIn) return;
  if (room.timer) clearTimeout(room.timer);
  room.timerEndsAt = Date.now() + 1500;
  emitter.broadcast(room);
  room.timer = setTimeout(() => endArcadeQuestion(room), 1500);
}

function grantChest(room: ServerRoom, award: ChestAward): void {
  const player = room.players.get(award.playerId);
  if (!player) return;
  player.chests.push({ uid: uid("chest"), source: award.source, earnedAtRound: room.roundNumber });
}

function applyScoreDelta(room: ServerRoom, delta: Record<string, number>): void {
  for (const [id, d] of Object.entries(delta)) {
    const p = room.players.get(id);
    if (!p) continue;
    p.score = applyDelta(p.score, d).next;
  }
}

function endArcadeQuestion(room: ServerRoom): void {
  if (room.isEventRound) {
    resolveEventRound(room);
    return;
  }
  const q = room.currentQuestion;
  if (!q) return;

  const ranks = ranksNow(room);
  const leaderId = leaderIdNow(room);
  const res = resolveArcadeQuestion({
    correctIndex: q.correctIndex,
    questionStartedAt: room.questionStartedAt,
    questionDurationMs: room.questionDurationMs,
    islandLoot: room.islandLoot ?? ["coins", "coins", "coins", "coins"],
    players: [...room.players.values()].map((p) => ({
      id: p.id,
      nickname: p.nickname,
      score: p.score,
      streak: p.streak,
      rank: ranks[p.id] ?? 1,
      choiceIndex: room.answers.get(p.id)?.choiceIndex,
      lockedAt: room.answers.get(p.id)?.lockedAt,
      mutinied: p.mutinied,
      skipped: p.marooned,
      rumRush: p.rumRush,
      parrotTargetId: p.parrotTargetId,
      plankUntil: p.plankUntil,
      surrendered: p.whiteFlagged,
    })),
    swordFights: room.swordFights,
    leaderId,
    poseidonUsed: new Set(
      [...room.players.values()].filter((p) => p.poseidonUsed).map((p) => p.id),
    ),
    socialMechanicsEnabled: room.roundNumber > ARCADE.FIRST_ITEM_WINDOW,
  });

  applyScoreDelta(room, res.scoreDelta);
  for (const award of res.chests) grantChest(room, award);
  for (const p of room.players.values()) {
    p.streak = res.streaks[p.id] ?? 0;
    if (res.rumRushConsumed.includes(p.id)) p.rumRush = false;
    if (res.poseidonBlessed.includes(p.id)) p.poseidonUsed = true;
    if (res.newlyMarooned.includes(p.id)) p.maroonPending = true;
    p.blockLoot += Math.max(0, res.results[p.id]?.earned ?? 0);
  }

  // Item onboarding: everyone receives their first item after regular question 5.
  const jackpotWinners: ServerPlayer[] = [];
  if (room.roundNumber === ARCADE.FIRST_ITEM_WINDOW) {
    for (const p of room.players.values()) {
      const r = res.results[p.id];
      if (r && !p.jackpotEarned) {
        p.jackpotEarned = true;
        r.jackpot = true;
        jackpotWinners.push(p);
      }
    }
  }

  // Push each player their personal outcome — drives the CORRECT!/WRONG overlay.
  for (const p of room.players.values()) {
    const r: QuestionResult | undefined = res.results[p.id];
    if (r) emitter.toPlayer(room, p.id, "question:result", r);
  }

  // The jackpot chest ceremony fires after the result overlay lands.
  for (const p of jackpotWinners) {
    setTimeout(() => openJackpotChest(room, p), TIMING.RESULT_OVERLAY_MS + 400);
  }

  const correctCount = [...room.players.values()].filter(
    (p) => res.results[p.id]?.correct,
  ).length;
  const headline = ev(
    "correctAnswer",
    `The answer: ${q.options[q.correctIndex]}`,
    correctCount === 0
      ? "Nobody got it. The sea laughs."
      : `${correctCount} pirate${correctCount === 1 ? "" : "s"} got it right.`,
    { icon: "🗺️", animation: "mapFlip" },
  );

  startReveal(room, [headline, ...res.events], () => afterArcadeReveal(room));
}

function startReveal(room: ServerRoom, events: RevealEvent[], after: () => void): void {
  room.revealEvents = events;
  const duration = Math.max(
    TIMING.ARCADE_REVEAL_MIN_MS,
    events.length * TIMING.ARCADE_REVEAL_STEP_MS + TIMING.RESULT_OVERLAY_MS,
  );
  setPhase(room, "reveal", duration, after);
}

function afterArcadeReveal(room: ServerRoom): void {
  // Every question lands on the fleet standings so rank changes are always visible.
  setPhase(room, "leaderboard", TIMING.ARCADE_LEADERBOARD_MS, () => nextArcadeRound(room));
}

// ---------------------------------------------------------------------------
// Special event: Million Pound Drop
// ---------------------------------------------------------------------------

function resolveEventRound(room: ServerRoom): void {
  const q = room.currentQuestion;
  if (!q) return;
  const ranks = ranksNow(room);
  const leaderId = leaderIdNow(room);
  const inputs = [...room.players.values()]
    .map((p) => ({
      id: p.id,
      nickname: p.nickname,
      allocation: room.answers.get(p.id)?.lootAllocation,
      pool: p.eventWager,
      rank: ranks[p.id] ?? 1,
      isLeader: p.id === leaderId,
      poseidonUsed: p.poseidonUsed,
    }));
  const res = resolveLootDrop(inputs, q.correctIndex, [], {
    enableWildcards: true,
    wagered: true,
  });
  applyScoreDelta(room, res.lootDelta);
  for (const award of res.chests) grantChest(room, award);
  if (res.sharkRewardPlayerId) {
    grantChest(room, { playerId: res.sharkRewardPlayerId, source: "underdog" });
    res.events.push(
      ev(
        "chestEarned",
        "Shark trophy! 🦈",
        "The lowest-ranked pirate survives the attack and earns a special catch-up chest.",
        { icon: "🦈", playerIds: [res.sharkRewardPlayerId], animation: "chest" },
      ),
    );
  }

  for (const p of room.players.values()) {
    const alloc = normaliseAllocation(room.answers.get(p.id)?.lootAllocation, p.eventWager);
    const kept = alloc[q.correctIndex] ?? 0;
    const delta = res.lootDelta[p.id] ?? 0;
    const r: QuestionResult = {
      correct: kept > 0 || res.poseidonBlessed.includes(p.id),
      correctIndex: q.correctIndex,
      earned: Math.max(0, p.eventWager + delta),
      streak: p.streak,
      streakBonus: 0,
      potAtLock: Math.max(0, p.eventWager + delta),
    };
    emitter.toPlayer(room, p.id, "question:result", r);
    if (res.poseidonBlessed.includes(p.id)) p.poseidonUsed = true;
    p.blockLoot = 0;
    p.eventWager = 0;
  }

  startReveal(room, res.events, () => afterArcadeReveal(room));
}

// ---------------------------------------------------------------------------
// Answers & mutiny
// ---------------------------------------------------------------------------

export function submitAnswer(
  room: ServerRoom,
  playerId: string,
  payload: { choiceIndex?: number; lootAllocation?: number[]; confident?: boolean },
): void {
  if (room.phase !== "question") return;
  const p = room.players.get(playerId);
  if (!p || p.marooned || p.mutinied || p.whiteFlagged) return;
  if (room.answers.has(playerId)) {
    emitter.toPlayer(room, playerId, "error", "Your course is already confirmed.");
    return;
  }
  const allocationPool = room.isEventRound ? p.eventWager : ARCADE.MPD_POOL;
  room.answers.set(playerId, {
    playerId,
    choiceIndex: payload.choiceIndex,
    lootAllocation: payload.lootAllocation
      ? normaliseAllocation(payload.lootAllocation, allocationPool)
      : undefined,
    lockedAt: Date.now(),
  });
  emitter.broadcast(room);
  maybeEndEarly(room);
}

export function declareMutiny(room: ServerRoom, playerId: string): void {
  if (room.phase !== "question" || room.isEventRound) return;
  if (room.roundNumber <= ARCADE.FIRST_ITEM_WINDOW) {
    emitter.toPlayer(room, playerId, "error", "Mutiny unlocks after question 5.");
    return;
  }
  const p = room.players.get(playerId);
  if (!p || p.marooned || p.mutinied) return;
  if (leaderIdNow(room) === playerId) {
    emitter.toPlayer(room, playerId, "error", "You're the captain — the mutiny is against YOU.");
    return;
  }
  p.mutinied = true;
  room.answers.delete(playerId);
  // Secret: only the mutineer knows. No broadcast, just their private echo.
  emitter.toPlayer(room, playerId, "player:privateState", privateState(room, p));
  emitter.toPlayer(room, playerId, "toast", {
    icon: "🏴",
    text: "Mutiny declared. Your answer is forfeited — nobody else knows.",
  });
  maybeEndEarly(room);
}

// ---------------------------------------------------------------------------
// Power-ups & chests
// ---------------------------------------------------------------------------

export function usePowerUp(
  room: ServerRoom,
  playerId: string,
  payload: { uid: string; targetId?: string },
): void {
  const p = room.players.get(playerId);
  if (!p) return;
  const idx = p.powerUps.findIndex((i) => i.uid === payload.uid);
  if (idx === -1) return;
  const owned = p.powerUps[idx];
  if (!owned) return;
  const def: PowerUpDef = POWERUPS[owned.powerUpId];
  if (room.phase !== "question") {
    emitter.toPlayer(room, playerId, "error", "Power-ups fire during questions.");
    return;
  }
  if (p.marooned) {
    emitter.toPlayer(room, playerId, "error", "You're marooned — no mischief from the island.");
    return;
  }
  let target: ServerPlayer | undefined;
  if (def.target === "otherPlayer") {
    target = payload.targetId ? room.players.get(payload.targetId) : undefined;
    if (!target || target.id === playerId) {
      emitter.toPlayer(room, playerId, "error", "Pick a target.");
      return;
    }
    if (target.marooned) {
      emitter.toPlayer(room, playerId, "error", "They're marooned — leave the castaway alone.");
      return;
    }
  }

  p.powerUps.splice(idx, 1);
  const q = room.currentQuestion;

  switch (owned.powerUpId) {
    case "eyepatch": {
      if (q) {
        const wrong = q.options
          .map((_, i) => i)
          .filter((i) => i !== q.correctIndex && !p.disabledOptions.includes(i));
        const removeCount = Math.max(1, wrong.length - 1);
        const shuffled = [...wrong].sort(() => Math.random() - 0.5);
        p.disabledOptions = [...p.disabledOptions, ...shuffled.slice(0, removeCount)];
      }
      emitter.toPlayer(room, playerId, "toast", {
        icon: "🏴‍☠️",
        text: "Eyepatch on — half the lies vanish.",
      });
      break;
    }
    case "parrot": {
      if (target) {
        p.parrotTargetId = target.id;
        emitter.toPlayer(room, playerId, "toast", {
          icon: "🦜",
          text: `Your parrot mimics ${target.nickname} — you'll copy their answer.`,
        });
      }
      break;
    }
    case "telescope": {
      if (target) p.telescopeTargetId = target.id;
      emitter.toPlayer(room, playerId, "toast", {
        text: target ? `Watching ${target.nickname}'s course through the telescope.` : "Pick a ship to watch.",
      });
      break;
    }
    case "hook": {
      if (target) {
        const stolen = target.powerUps.splice(
          Math.floor(Math.random() * target.powerUps.length),
          1,
        )[0];
        if (stolen) {
          p.powerUps.push(stolen);
          emitter.toPlayer(room, playerId, "toast", {
            icon: "🪝",
            text: `Hooked ${POWERUPS[stolen.powerUpId].name} from ${target.nickname}!`,
          });
          emitter.toPlayer(room, target.id, "toast", {
            icon: "🪝",
            text: `${p.nickname} hooked one of your power-ups!`,
          });
        } else {
          emitter.toPlayer(room, playerId, "toast", {
            icon: "🪝",
            text: `${target.nickname}'s bag was empty. Wasted hook.`,
          });
        }
      }
      break;
    }
    case "whiteFlag": {
      p.whiteFlagged = true;
      room.answers.delete(playerId);
      emitter.toPlayer(room, playerId, "toast", {
        text: `White flag raised. You sit this question out and preserve a ${p.streak}-answer streak.`,
      });
      maybeEndEarly(room);
      break;
    }
    case "secretX": {
      if (q) {
        p.revealedAnswerIndex = q.correctIndex;
        emitter.toPlayer(room, playerId, "toast", {
          icon: "❌",
          text: "X marks the spot. You know the answer.",
        });
      }
      break;
    }
    case "rumRush": {
      p.rumRush = true;
      emitter.toPlayer(room, playerId, "toast", {
        icon: "🍾",
        text: "Rum Rush! Next correct answer pays DOUBLE.",
      });
      break;
    }
    case "walkThePlank": {
      if (target) {
        target.plankUntil = Date.now() + TIMING.PLANK_MS;
        emitter.toPlayer(room, target.id, "player:privateState", privateState(room, target));
        emitter.toPlayer(room, target.id, "toast", {
          icon: "🪵",
          text: `${p.nickname} sends you down the plank — answer in ${ARCADE.PLANK_SECONDS}s or get NOTHING!`,
        });
      }
      break;
    }
    case "swordFight": {
      if (target) {
        room.swordFights.push({ byId: playerId, targetId: target.id });
        emitter.toPlayer(room, target.id, "toast", {
          icon: "⚔️",
          text: `${p.nickname} challenges you to a SWORD FIGHT on this question!`,
        });
        ticker(room, `⚔️ ${p.nickname} draws steel on ${target.nickname}!`);
      }
      break;
    }
    case "cannonball": {
      if (target) {
        target.cannonballed = true;
        emitter.toPlayer(room, target.id, "player:privateState", privateState(room, target));
        emitter.toPlayer(room, target.id, "toast", {
          icon: "💣",
          text: `CANNONBALL from ${p.nickname}! Your answers are full of holes!`,
        });
      }
      break;
    }
    case "cannonballBarrage": {
      for (const other of room.players.values()) {
        if (other.id === playerId || other.marooned) continue;
        other.cannonballed = true;
        emitter.toPlayer(room, other.id, "player:privateState", privateState(room, other));
        emitter.toPlayer(room, other.id, "toast", {
          icon: "🧨",
          text: `BARRAGE! ${p.nickname} shells the whole crew!`,
        });
      }
      break;
    }
    case "barnacle": {
      if (target && q) {
        const available = q.options.map((_, index) => index).filter((index) => !target.disabledOptions.includes(index));
        const covered = available[Math.floor(Math.random() * available.length)];
        if (covered !== undefined) target.disabledOptions.push(covered);
        emitter.toPlayer(room, target.id, "player:privateState", privateState(room, target));
        emitter.toPlayer(room, target.id, "toast", {
          text: `${p.nickname}'s barnacle net covered one of your island charts.`,
        });
      }
      break;
    }
    case "barnacleInfestation": {
      if (q) {
        for (const other of room.players.values()) {
          if (other.id === playerId || other.marooned) continue;
          const available = q.options.map((_, index) => index).filter((index) => !other.disabledOptions.includes(index));
          const covered = available[Math.floor(Math.random() * available.length)];
          if (covered !== undefined) other.disabledOptions.push(covered);
          emitter.toPlayer(room, other.id, "player:privateState", privateState(room, other));
          emitter.toPlayer(room, other.id, "toast", {
            text: `${p.nickname} infested your island charts with barnacles.`,
          });
        }
      }
      break;
    }
  }

  // Every item is visible on the shared fleet board; private information stays in private state.
  const targetIds =
    def.target === "allOthers"
      ? [...room.players.keys()].filter((id) => id !== playerId)
      : target
        ? [target.id]
        : [playerId];
  emitter.toRoom(room, "powerup:fired", {
    byId: playerId,
    targetIds,
    powerUpId: owned.powerUpId,
  });
  if (def.isAttack) {
    ticker(room, `${def.icon} ${p.nickname} fires ${def.name}!`);
  }
  emitter.broadcast(room);
}

function openJackpotChest(room: ServerRoom, p: ServerPlayer): void {
  // Jackpot chests roll with underdog odds — generous by design.
  const rarity = rollRarity(oddsForRank(room.players.size, room.players.size));
  finishChestOpen(room, p, uid("chest"), rarity, true);
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
  const ranks = ranksNow(room);
  const rarity = rollRarity(oddsForRank(ranks[playerId] ?? room.players.size, room.players.size));
  finishChestOpen(room, p, chestUid, rarity, false);
}

function finishChestOpen(
  room: ServerRoom,
  p: ServerPlayer,
  chestUid: string,
  rarity: Rarity,
  jackpot: boolean,
): void {
  const powerUpId = rollPowerUp(rarity);
  const owned: OwnedPowerUp = { uid: uid("pu"), powerUpId };
  p.powerUps.push(owned);
  emitter.toPlayer(room, p.id, "chest:opened", {
    uid: chestUid,
    rarity,
    powerUp: owned,
    powerUpDef: POWERUPS[powerUpId],
    jackpot,
  });
  ticker(room, `🎁 ${p.nickname} opened a chest...`);
  emitter.broadcast(room);
}

export function forceChest(room: ServerRoom, playerId: string, _rarity?: Rarity): void {
  grantChest(room, { playerId, source: "debug" });
  emitter.toast(room, playerId, { icon: "🧪", text: "Debug chest granted" });
  emitter.broadcast(room);
}

// ---------------------------------------------------------------------------
// Host / phase control
// ---------------------------------------------------------------------------

export function hostAdvance(room: ServerRoom, playerId: string): void {
  if (room.phase === "round_intro" && room.players.has(playerId)) {
    skipTimer(room);
    return;
  }
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
