/**
 * Treasure Trap: Voyage — Path B logic.js
 * Beauty milestone: lobby → 3 questions → LOCKED Loot Drop → winner.
 * Soft client countdown (T1): clients may send { type: "timeout" }.
 * Loot Drop: correct venture returns wager; wrong ventures lose (not multipliers).
 */

export const meta = {
  game: "Treasure Trap: Voyage",
  minPlayers: 2,
  maxPlayers: 4,
};

const QUESTIONS = [
  {
    id: "q1",
    text: "Which pirate flag is the classic skull and crossbones?",
    answers: ["Jolly Roger", "Black Pearl", "Red Ensign", "Union Jack"],
    correctIndex: 0,
  },
  {
    id: "q2",
    text: "What do pirates call stolen treasure?",
    answers: ["Booty", "Bounty", "Ballast", "Bilge"],
    correctIndex: 0,
  },
  {
    id: "q3",
    text: "A ship’s left side when facing forward is the…",
    answers: ["Starboard", "Port", "Bow", "Stern"],
    correctIndex: 1,
  },
];

/** Loot Drop uses a real quiz question — one correct answer island. */
const LOOT_QUESTION = {
  id: "loot",
  text: "Which legendary pirate was nicknamed Blackbeard?",
  answers: ["Calico Jack", "Henry Morgan", "Edward Teach", "Anne Bonny"],
  correctIndex: 2,
};

const VENTURES = [
  { id: "v0", name: "A", island: 0 },
  { id: "v1", name: "B", island: 1 },
  { id: "v2", name: "C", island: 2 },
  { id: "v3", name: "D", island: 3 },
];

const COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f"];
const Q_MS = 18000;
const LOOT_MS = 40000;
const REVEAL_HOLD_MS = 5200;
const VENTURE_REVEAL_MS = 3200;
const WILDCARD_MS = 5200;
const LOOT_INTRO_MS = 2600;
const BASE_SCORE = 100;
const SPEED_BONUS_MAX = 40;
const STEP = 10;
const SHARK_PCT = 0.12;
const MAJORITY_RATIO = 0.5;

function now() {
  return Date.now();
}

function clone(state) {
  return JSON.parse(JSON.stringify(state));
}

function emptyAlloc() {
  return { v0: 0, v1: 0, v2: 0, v3: 0 };
}

function sumAlloc(a) {
  return (a.v0 || 0) + (a.v1 || 0) + (a.v2 || 0) + (a.v3 || 0);
}

function nickFromId(playerId) {
  const parts = String(playerId).split("::");
  if (parts.length >= 2 && parts[1]) {
    try {
      return decodeURIComponent(parts[1]).slice(0, 14);
    } catch {
      return parts[1].slice(0, 14);
    }
  }
  return "Pirate " + String(playerId).slice(-4);
}

function isBotId(playerId) {
  return String(playerId).startsWith("bot-");
}

function publicPlayers(state, viewerId) {
  const viewerAnswered = state.answers[viewerId] != null;
  const revealAnswers = state.phase === "q_reveal" || state.phase === "winner";
  return state.seats.map((id, i) => {
    const hasAnswer = state.answers[id] != null;
    // Hide whether rivals answered / where they sailed until YOU commit (or reveal).
    const showAnswered =
      id === viewerId || viewerAnswered || revealAnswers ? hasAnswer : false;
    return {
      id,
      nick: nickFromId(id),
      color: COLORS[i % COLORS.length],
      seat: i,
      score: state.scores[id] || 0,
      locked: !!state.locked[id],
      answered: showAnswered,
      isBot: isBotId(id),
      ready: !!state.ready[id],
    };
  });
}

function rankOrder(state) {
  return [...state.seats].sort((a, b) => (state.scores[b] || 0) - (state.scores[a] || 0));
}

function softTimeoutOk(state) {
  if (!state.deadlineAt) return false;
  return now() >= state.deadlineAt - 400;
}

function startQuestion(state, qi) {
  state.phase = "question";
  state.questionIndex = qi;
  state.answers = {};
  state.phaseStartedAt = now();
  state.deadlineAt = state.phaseStartedAt + Q_MS;
  state.reveal = null;
  state.locked = {};
}

function resolveQuestion(state) {
  const q = QUESTIONS[state.questionIndex];
  const results = {};
  for (const id of state.seats) {
    const ans = state.answers[id];
    const correct = ans != null && ans.index === q.correctIndex;
    let delta = 0;
    if (correct) {
      const elapsed = Math.max(0, (ans.at || state.deadlineAt) - state.phaseStartedAt);
      const speed = Math.max(0, 1 - elapsed / Q_MS);
      delta = BASE_SCORE + Math.round(SPEED_BONUS_MAX * speed);
      state.scores[id] = (state.scores[id] || 0) + delta;
      state.blockLoot[id] = (state.blockLoot[id] || 0) + delta;
    }
    results[id] = {
      index: ans == null ? null : ans.index,
      correct,
      delta,
      score: state.scores[id] || 0,
    };
  }
  state.reveal = { kind: "answer", correctIndex: q.correctIndex, results, at: now() };
  state.phase = "q_reveal";
  state.phaseStartedAt = now();
  state.deadlineAt = state.phaseStartedAt + REVEAL_HOLD_MS;
}

function startLootIntro(state) {
  state.phase = "loot_intro";
  state.phaseStartedAt = now();
  state.deadlineAt = state.phaseStartedAt + LOOT_INTRO_MS;
  state.reveal = null;
  state.lootVentureIndex = 0;
  state.ventureResolved = [];
}

function startLootAlloc(state) {
  state.phase = "loot";
  state.allocations = {};
  state.locked = {};
  state.lootPool = {};
  for (const id of state.seats) {
    const pool = Math.max(0, Math.floor((state.blockLoot[id] || 0) / STEP) * STEP);
    state.lootPool[id] = pool;
    state.allocations[id] = emptyAlloc();
  }
  state.phaseStartedAt = now();
  state.deadlineAt = state.phaseStartedAt + LOOT_MS;
  state.reveal = null;
}

function computeLootOutcomes(state) {
  const correct = LOOT_QUESTION.correctIndex;
  const correctId = VENTURES[correct].id;
  const outcomes = {};
  let correctPickers = 0;

  for (const id of state.seats) {
    const alloc = state.allocations[id] || emptyAlloc();
    const before = state.scores[id] || 0;
    const byVenture = {};
    let returned = 0;
    let lost = 0;
    for (const v of VENTURES) {
      const put = alloc[v.id] || 0;
      const ok = v.island === correct;
      const got = ok ? put : 0;
      byVenture[v.id] = { put, got, ok };
      if (ok) returned += got;
      else lost += put;
    }
    if ((alloc[correctId] || 0) > 0) correctPickers += 1;
    const wagered = sumAlloc(alloc);
    // Spend wager from score, then bank returns from correct venture only
    const after = Math.max(0, before - wagered + returned);
    outcomes[id] = {
      byVenture,
      wagered,
      returned,
      lost,
      before,
      after,
      rescued: false,
      sharkBite: 0,
    };
    state.scores[id] = after;
  }

  state._lootMeta = {
    correctIndex: correct,
    correctId,
    correctPickers,
    majority: correctPickers / state.seats.length >= MAJORITY_RATIO,
  };
  return outcomes;
}

function startVentureReveal(state) {
  const outcomes = computeLootOutcomes(state);
  state.reveal = {
    kind: "loot_sequence",
    outcomes,
    correctIndex: LOOT_QUESTION.correctIndex,
    ventureIndex: 0,
    poseidon: null,
    shark: null,
  };
  state.phase = "loot_reveal";
  state.lootVentureIndex = 0;
  state.phaseStartedAt = now();
  state.deadlineAt = state.phaseStartedAt + VENTURE_REVEAL_MS;
}

function advanceLootReveal(state) {
  const next = (state.lootVentureIndex || 0) + 1;
  if (next < 4) {
    state.lootVentureIndex = next;
    state.reveal.ventureIndex = next;
    state.phaseStartedAt = now();
    state.deadlineAt = state.phaseStartedAt + VENTURE_REVEAL_MS;
    return;
  }
  // Wildcards after all ventures shown
  applyWildcards(state);
  state.phase = "loot_wildcard";
  state.phaseStartedAt = now();
  state.deadlineAt = state.phaseStartedAt + WILDCARD_MS;
}

function applyWildcards(state) {
  const outcomes = state.reveal.outcomes;
  const leader = rankOrder(state)[0];
  const correct = LOOT_QUESTION.correctIndex;
  const correctId = VENTURES[correct].id;

  // Poseidon: non-leader who lost everything on wrong ventures (returned 0, wagered > 0)
  let poseidonTarget = null;
  for (const id of state.seats) {
    const o = outcomes[id];
    if (!o || id === leader) continue;
    if (o.wagered > 0 && o.returned === 0 && !o.rescued) {
      poseidonTarget = id;
      break;
    }
  }
  if (poseidonTarget) {
    const o = outcomes[poseidonTarget];
    const rescue = o.lost;
    o.rescued = true;
    o.after = Math.max(0, o.after + rescue);
    o.returned += rescue;
    // Move lost amount onto correct venture visually
    o.byVenture[correctId].got = (o.byVenture[correctId].got || 0) + rescue;
    state.scores[poseidonTarget] = o.after;
    state.reveal.poseidon = { playerId: poseidonTarget, amount: rescue };
  }

  // Shark: if majority backed correct, bite everyone who returned > 0 (funny bounded)
  if (state._lootMeta && state._lootMeta.majority) {
    const bites = {};
    for (const id of state.seats) {
      const o = outcomes[id];
      if (!o || o.returned <= 0) continue;
      const bite = Math.max(STEP, Math.floor(o.returned * SHARK_PCT / STEP) * STEP);
      const after = Math.max(0, o.after - bite);
      o.sharkBite = bite;
      o.after = after;
      state.scores[id] = after;
      bites[id] = bite;
    }
    state.reveal.shark = { bites };
  }
}

function finishGame(state) {
  state.phase = "winner";
  state.ranking = rankOrder(state);
  state.phaseStartedAt = now();
  state.deadlineAt = null;
}

function allAnswered(state) {
  return state.seats.every((id) => state.answers[id] != null);
}

function allLocked(state) {
  return state.seats.every((id) => state.locked[id]);
}

function allReady(state) {
  return state.seats.every((id) => state.ready[id]);
}

function advanceFromReveal(state) {
  if (state.phase === "q_reveal") {
    const next = state.questionIndex + 1;
    if (next >= QUESTIONS.length) startLootIntro(state);
    else startQuestion(state, next);
  } else if (state.phase === "loot_intro") {
    startLootAlloc(state);
  } else if (state.phase === "loot_reveal") {
    advanceLootReveal(state);
  } else if (state.phase === "loot_wildcard") {
    finishGame(state);
  }
}

export function setup(players) {
  const seats = players.slice(0, 4);
  const scores = {};
  const blockLoot = {};
  const ready = {};
  for (const id of seats) {
    scores[id] = 0;
    blockLoot[id] = 0;
    ready[id] = isBotId(id); // bots auto-ready
  }
  return {
    phase: "lobby",
    seats,
    scores,
    blockLoot,
    ready,
    answers: {},
    allocations: {},
    locked: {},
    lootPool: {},
    questionIndex: 0,
    lootVentureIndex: 0,
    phaseStartedAt: now(),
    deadlineAt: null,
    reveal: null,
    ranking: null,
    hostId: seats[0],
    _lootMeta: null,
  };
}

export function validateAction(state, playerId, action) {
  if (!action || typeof action !== "object" || !action.type) {
    return { ok: false, error: "That move went overboard." };
  }
  if (!state.seats.includes(playerId)) {
    return { ok: false, error: "You are not in this crew." };
  }

  switch (action.type) {
    case "ready": {
      if (state.phase !== "lobby") return { ok: false, error: "Not in lobby." };
      return { ok: true };
    }
    case "start": {
      if (state.phase !== "lobby") return { ok: false, error: "Not in lobby." };
      if (playerId !== state.hostId) return { ok: false, error: "Only the host can cast off." };
      if (state.seats.length < 2) return { ok: false, error: "Need at least 2 pirates." };
      if (!allReady(state)) return { ok: false, error: "Wait for the crew to ready up." };
      return { ok: true };
    }
    case "answer": {
      if (state.phase !== "question") return { ok: false, error: "No question on the horizon." };
      if (state.answers[playerId] != null) return { ok: false, error: "You already sailed!" };
      const idx = action.index;
      if (typeof idx !== "number" || idx < 0 || idx > 3) {
        return { ok: false, error: "Pick an island A–D." };
      }
      return { ok: true };
    }
    case "alloc": {
      if (state.phase !== "loot") return { ok: false, error: "Loot Drop has not begun." };
      if (state.locked[playerId]) return { ok: false, error: "You already locked in!" };
      const venture = action.venture;
      const amount = action.amount;
      if (!VENTURES.some((v) => v.id === venture)) {
        return { ok: false, error: "Unknown venture." };
      }
      if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
        return { ok: false, error: "Bad loot amount." };
      }
      const stepped = Math.floor(amount / STEP) * STEP;
      const next = { ...(state.allocations[playerId] || emptyAlloc()), [venture]: stepped };
      if (sumAlloc(next) > (state.lootPool[playerId] || 0)) {
        return { ok: false, error: "No loot left!" };
      }
      return { ok: true };
    }
    case "pick": {
      // Quiz-style: put entire loot pool on one answer island.
      if (state.phase !== "loot") return { ok: false, error: "Loot Drop has not begun." };
      if (state.locked[playerId]) return { ok: false, error: "You already locked in!" };
      if (!VENTURES.some((v) => v.id === action.venture)) {
        return { ok: false, error: "Unknown venture." };
      }
      return { ok: true };
    }
    case "lock": {
      if (state.phase !== "loot") return { ok: false, error: "Loot Drop has not begun." };
      if (state.locked[playerId]) return { ok: false, error: "Already locked!" };
      return { ok: true };
    }
    case "timeout": {
      if (
        state.phase === "question" ||
        state.phase === "loot" ||
        state.phase === "q_reveal" ||
        state.phase === "loot_intro" ||
        state.phase === "loot_reveal" ||
        state.phase === "loot_wildcard"
      ) {
        if (!softTimeoutOk(state)) return { ok: false, error: "Clock still ticking…" };
        return { ok: true };
      }
      return { ok: false, error: "Nothing to time out." };
    }
    case "advance": {
      if (
        state.phase === "q_reveal" ||
        state.phase === "loot_intro" ||
        state.phase === "loot_reveal" ||
        state.phase === "loot_wildcard"
      ) {
        if (!softTimeoutOk(state) && playerId !== state.hostId) {
          return { ok: false, error: "Hold for the reveal…" };
        }
        return { ok: true };
      }
      return { ok: false, error: "Nothing to advance." };
    }
    default:
      return { ok: false, error: "Unknown orders." };
  }
}

export function applyAction(state, playerId, action) {
  const s = clone(state);

  switch (action.type) {
    case "ready": {
      s.ready[playerId] = true;
      break;
    }
    case "start": {
      for (const id of s.seats) {
        s.scores[id] = 0;
        s.blockLoot[id] = 0;
      }
      startQuestion(s, 0);
      break;
    }
    case "answer": {
      s.answers[playerId] = { index: action.index, at: now() };
      if (allAnswered(s)) resolveQuestion(s);
      break;
    }
    case "alloc": {
      const cur = s.allocations[playerId] || emptyAlloc();
      cur[action.venture] = Math.floor(action.amount / STEP) * STEP;
      s.allocations[playerId] = cur;
      break;
    }
    case "pick": {
      const pool = Math.floor((s.lootPool[playerId] || 0) / STEP) * STEP;
      const next = emptyAlloc();
      next[action.venture] = pool;
      s.allocations[playerId] = next;
      break;
    }
    case "lock": {
      s.locked[playerId] = true;
      if (allLocked(s)) startVentureReveal(s);
      break;
    }
    case "timeout": {
      if (s.phase === "question") resolveQuestion(s);
      else if (s.phase === "loot") startVentureReveal(s);
      else advanceFromReveal(s);
      break;
    }
    case "advance": {
      advanceFromReveal(s);
      break;
    }
    default:
      break;
  }

  return s;
}

export function isGameOver(state) {
  if (state.phase !== "winner") return { over: false };
  const winner = (state.ranking && state.ranking[0]) || state.seats[0];
  return { over: true, winner };
}

export function viewFor(state, playerId) {
  const q = QUESTIONS[state.questionIndex] || QUESTIONS[0];
  const alloc = state.allocations[playerId] || emptyAlloc();
  const pool = state.lootPool[playerId] || 0;

  let publicReveal = null;
  if (state.reveal) {
    if (state.reveal.kind === "answer") {
      publicReveal = {
        kind: "answer",
        correctIndex: state.reveal.correctIndex,
        results: state.reveal.results,
      };
    } else if (state.reveal.kind === "loot_sequence") {
      // During sequential reveal, only expose ventures up to current index
      const vi = state.lootVentureIndex || 0;
      const outcomes = {};
      for (const id of state.seats) {
        const raw = state.reveal.outcomes[id];
        const filtered = { ...raw, byVenture: {} };
        for (let i = 0; i < 4; i++) {
          const vid = VENTURES[i].id;
          if (i <= vi || state.phase === "loot_wildcard" || state.phase === "winner") {
            filtered.byVenture[vid] = raw.byVenture[vid];
          } else {
            filtered.byVenture[vid] = { put: "?", got: "?", ok: null };
          }
        }
        // Hide other players' exact puts until wildcard/end — show only resolved venture results publicly
        if (id !== playerId && state.phase === "loot_reveal") {
          for (let i = 0; i <= vi; i++) {
            const vid = VENTURES[i].id;
            const cell = raw.byVenture[vid];
            filtered.byVenture[vid] = {
              put: cell.put > 0 ? true : false,
              got: cell.got,
              ok: cell.ok,
            };
          }
        }
        outcomes[id] = filtered;
      }
      publicReveal = {
        kind: "loot_sequence",
        outcomes,
        correctIndex:
          state.phase === "loot_wildcard" || vi >= LOOT_QUESTION.correctIndex
            ? LOOT_QUESTION.correctIndex
            : null,
        ventureIndex: vi,
        poseidon: state.phase === "loot_wildcard" ? state.reveal.poseidon : null,
        shark: state.phase === "loot_wildcard" ? state.reveal.shark : null,
      };
    }
  }

  const showQuestion =
    state.phase === "question" || state.phase === "q_reveal"
      ? {
          text: q.text,
          answers: q.answers,
          correctIndex: state.phase === "q_reveal" ? q.correctIndex : null,
        }
      : state.phase === "loot" ||
          state.phase === "loot_intro" ||
          state.phase === "loot_reveal" ||
          state.phase === "loot_wildcard"
        ? {
            text: LOOT_QUESTION.text,
            answers: LOOT_QUESTION.answers,
            correctIndex:
              state.phase === "loot_wildcard" ||
              (state.phase === "loot_reveal" &&
                (state.lootVentureIndex || 0) >= LOOT_QUESTION.correctIndex)
                ? LOOT_QUESTION.correctIndex
                : null,
          }
        : null;

  return {
    phase: state.phase,
    players: publicPlayers(state, playerId),
    questionIndex: state.questionIndex,
    questionTotal: QUESTIONS.length,
    question: showQuestion,
    ventures: VENTURES.map((v) => ({ id: v.id, name: v.name, island: v.island })),
    deadlineAt: state.deadlineAt,
    serverNow: now(),
    reveal: publicReveal,
    ranking: state.ranking,
    lootVentureIndex: state.lootVentureIndex || 0,
    you: {
      answered: state.answers[playerId] != null,
      answerIndex: state.answers[playerId] ? state.answers[playerId].index : null,
      allocation: alloc,
      lootLeft: pool - sumAlloc(alloc),
      lootPool: pool,
      locked: !!state.locked[playerId],
      ready: !!state.ready[playerId],
      isHost: playerId === state.hostId,
      score: state.scores[playerId] || 0,
      isBot: isBotId(playerId),
    },
    qMs: Q_MS,
    lootMs: LOOT_MS,
    step: STEP,
  };
}
