/**
 * Treasure Trap: Voyage — Higgsfield Game logic.js
 * Beauty vertical slice: 2 pirates → 3 questions → mini Loot Drop → winner.
 * Soft client countdown (T1): clients may send { type: "timeout" };
 * server validates elapsed time via timestamps — no setTimeout here.
 */

export const meta = {
  game: "Treasure Trap: Voyage",
  minPlayers: 2,
  maxPlayers: 2,
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

const VENTURES = [
  { id: "safe", name: "Safe Cove", mult: 1.2 },
  { id: "reef", name: "Coral Reef", mult: 1.8 },
  { id: "storm", name: "Storm Bank", mult: 2.6 },
  { id: "cursed", name: "Cursed Vault", mult: 4.0 },
];

const COLORS = ["#e74c3c", "#3498db"];
const Q_MS = 18000;
const LOOT_MS = 28000;
const REVEAL_HOLD_MS = 1600;
const LOOT_REVEAL_MS = 5000;
const BASE_SCORE = 100;
const SPEED_BONUS_MAX = 40;
const RESCUE_GOLD = 40;

function now() {
  return Date.now();
}

function clone(state) {
  return JSON.parse(JSON.stringify(state));
}

function emptyAlloc() {
  return { safe: 0, reef: 0, storm: 0, cursed: 0 };
}

function sumAlloc(a) {
  return (a.safe || 0) + (a.reef || 0) + (a.storm || 0) + (a.cursed || 0);
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

function publicPlayers(state) {
  return state.seats.map((id, i) => ({
    id,
    nick: nickFromId(id),
    color: COLORS[i % COLORS.length],
    seat: i,
    score: state.scores[id] || 0,
    locked: !!state.locked[id],
    answered: state.answers[id] != null,
  }));
}

function rankOrder(state) {
  return [...state.seats].sort((a, b) => (state.scores[b] || 0) - (state.scores[a] || 0));
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
  state.reveal = {
    kind: "answer",
    correctIndex: q.correctIndex,
    results,
    at: now(),
  };
  state.phase = "q_reveal";
  state.phaseStartedAt = now();
  state.deadlineAt = state.phaseStartedAt + REVEAL_HOLD_MS;
}

function startLoot(state) {
  state.phase = "loot";
  state.allocations = {};
  state.locked = {};
  state.lootPool = {};
  for (const id of state.seats) {
    state.lootPool[id] = state.blockLoot[id] || 0;
    state.allocations[id] = emptyAlloc();
  }
  state.phaseStartedAt = now();
  state.deadlineAt = state.phaseStartedAt + LOOT_MS;
  state.reveal = null;
}

function resolveLoot(state) {
  const outcomes = {};
  for (const id of state.seats) {
    const alloc = state.allocations[id] || emptyAlloc();
    const before = state.scores[id] || 0;
    let gained = 0;
    const byVenture = {};
    for (const v of VENTURES) {
      const put = alloc[v.id] || 0;
      const got = Math.floor(put * v.mult);
      byVenture[v.id] = { put, got, mult: v.mult };
      gained += got;
    }
    const wagered = sumAlloc(alloc);
    const after = Math.max(0, before - wagered + gained);
    outcomes[id] = { byVenture, wagered, gained, before, after, rescued: false };
    state.scores[id] = after;
  }

  const leader = rankOrder(state)[0];
  for (const id of state.seats) {
    if ((state.scores[id] || 0) === 0 && id !== leader && state.seats.length > 1) {
      state.scores[id] = RESCUE_GOLD;
      outcomes[id].after = RESCUE_GOLD;
      outcomes[id].rescued = true;
    }
  }

  state.reveal = { kind: "loot", outcomes, at: now() };
  state.phase = "loot_reveal";
  state.phaseStartedAt = now();
  state.deadlineAt = state.phaseStartedAt + LOOT_REVEAL_MS;
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

function softTimeoutOk(state) {
  if (!state.deadlineAt) return false;
  return now() >= state.deadlineAt - 400;
}

function advanceFromReveal(state) {
  if (state.phase === "q_reveal") {
    const next = state.questionIndex + 1;
    if (next >= QUESTIONS.length) startLoot(state);
    else startQuestion(state, next);
  } else if (state.phase === "loot_reveal") {
    finishGame(state);
  }
}

export function setup(players) {
  const seats = players.slice(0, 2);
  const scores = {};
  const blockLoot = {};
  for (const id of seats) {
    scores[id] = 0;
    blockLoot[id] = 0;
  }
  const state = {
    phase: "question",
    seats,
    scores,
    blockLoot,
    answers: {},
    allocations: {},
    locked: {},
    lootPool: {},
    questionIndex: 0,
    phaseStartedAt: now(),
    deadlineAt: null,
    reveal: null,
    ranking: null,
    hostId: seats[0],
  };
  startQuestion(state, 0);
  return state;
}

export function validateAction(state, playerId, action) {
  if (!action || typeof action !== "object" || !action.type) {
    return { ok: false, error: "That move went overboard." };
  }
  if (!state.seats.includes(playerId)) {
    return { ok: false, error: "You are not in this crew." };
  }

  switch (action.type) {
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
      const next = {
        ...(state.allocations[playerId] || emptyAlloc()),
        [venture]: Math.floor(amount),
      };
      if (sumAlloc(next) > (state.lootPool[playerId] || 0)) {
        return { ok: false, error: "No loot left!" };
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
        state.phase === "loot_reveal"
      ) {
        if (!softTimeoutOk(state)) return { ok: false, error: "Clock still ticking…" };
        return { ok: true };
      }
      return { ok: false, error: "Nothing to time out." };
    }
    case "advance": {
      if (state.phase === "q_reveal" || state.phase === "loot_reveal") {
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
    case "answer": {
      s.answers[playerId] = { index: action.index, at: now() };
      if (allAnswered(s)) resolveQuestion(s);
      break;
    }
    case "alloc": {
      const cur = s.allocations[playerId] || emptyAlloc();
      cur[action.venture] = Math.floor(action.amount);
      s.allocations[playerId] = cur;
      break;
    }
    case "lock": {
      s.locked[playerId] = true;
      if (allLocked(s)) resolveLoot(s);
      break;
    }
    case "timeout": {
      if (s.phase === "question") resolveQuestion(s);
      else if (s.phase === "loot") resolveLoot(s);
      else if (s.phase === "q_reveal" || s.phase === "loot_reveal") advanceFromReveal(s);
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

  const publicReveal =
    state.reveal == null
      ? null
      : state.reveal.kind === "answer"
        ? {
            kind: "answer",
            correctIndex: state.reveal.correctIndex,
            results: state.reveal.results,
          }
        : {
            kind: "loot",
            outcomes: state.reveal.outcomes,
          };

  return {
    phase: state.phase,
    players: publicPlayers(state),
    questionIndex: state.questionIndex,
    questionTotal: QUESTIONS.length,
    question:
      state.phase === "question" || state.phase === "q_reveal"
        ? {
            text: q.text,
            answers: q.answers,
            correctIndex: state.phase === "q_reveal" ? q.correctIndex : null,
          }
        : null,
    ventures: VENTURES.map((v) => ({ id: v.id, name: v.name, mult: v.mult })),
    deadlineAt: state.deadlineAt,
    serverNow: now(),
    reveal: publicReveal,
    ranking: state.ranking,
    you: {
      answered: state.answers[playerId] != null,
      answerIndex: state.answers[playerId] ? state.answers[playerId].index : null,
      allocation: alloc,
      lootLeft: pool - sumAlloc(alloc),
      lootPool: pool,
      locked: !!state.locked[playerId],
      isHost: playerId === state.hostId,
      score: state.scores[playerId] || 0,
    },
    qMs: Q_MS,
    lootMs: LOOT_MS,
  };
}
