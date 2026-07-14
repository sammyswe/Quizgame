import type {
  Answer,
  Chest,
  GameConfig,
  OwnedPowerUp,
  Phase,
  PowerUpId,
  Question,
  RevealEvent,
  SpecialEventId,
} from "@treasure-trap/shared";

/** Full server-side player. Only sanitised slices ever leave the server. */
export type ServerPlayer = {
  id: string;
  socketId?: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  isBot: boolean;
  connected: boolean;
  score: number;
  streak: number;
  powerUps: OwnedPowerUp[];
  chests: Chest[];
  /** Secretly declared mutiny this question. */
  mutinied: boolean;
  /** Sitting this question out (was marooned last question). */
  marooned: boolean;
  /** Marooned NEXT question (set at reveal, applied at next question start). */
  maroonPending: boolean;
  /** Earned the first-5 jackpot item already. */
  jackpotEarned: boolean;
  /** Rum Rush pending on next correct answer. */
  rumRush: boolean;
  /** Eyepatch / Secret X: wrong options hidden for this player. */
  disabledOptions: number[];
  /** Secret X revealed answer index (private). */
  revealedAnswerIndex?: number;
  /** Parrot: copying this player's answer at the reveal. */
  parrotTargetId?: string;
  /** Telescope: horizon text (private). */
  horizon?: string;
  /** Cannonball: answers visually holed this question. */
  cannonballed: boolean;
  /** Walk the Plank: must answer before this epoch ms. */
  plankUntil?: number;
  /** Poseidon already blessed this player this game. */
  poseidonUsed: boolean;
};

export type ServerRoom = {
  code: string;
  hostId: string;
  players: Map<string, ServerPlayer>;
  phase: Phase;
  config: GameConfig;
  /** 1-based current round number; 0 before the game starts. */
  roundNumber: number;
  totalRounds: number;
  isEventRound: boolean;
  eventId?: SpecialEventId;
  currentQuestion?: Question;
  questionStartedAt: number;
  questionDurationMs: number;
  usedQuestionIds: Set<string>;
  answers: Map<string, Answer>;
  /** Sword fights declared this question. */
  swordFights: Array<{ byId: string; targetId: string }>;
  revealEvents: RevealEvent[];
  timer?: ReturnType<typeof setTimeout>;
  /** The continuation scheduled for the current phase — skipTimer runs it early. */
  onPhaseEnd?: () => void;
  timerEndsAt: number;
  ticker: string[];
  winnerId?: string;
  createdAt: number;
};

const AVATAR_POOL = ["🦜", "🐙", "🦈", "🐢", "🦑", "🦀", "🦞", "🐡", "🐬", "🐋"];

export function nextAvatar(room: Pick<ServerRoom, "players">): string {
  const used = new Set([...room.players.values()].map((p) => p.avatar));
  return AVATAR_POOL.find((a) => !used.has(a)) ?? "🏴‍☠️";
}

export function createPlayer(
  id: string,
  nickname: string,
  opts: Partial<ServerPlayer> = {},
): ServerPlayer {
  return {
    id,
    nickname: nickname.slice(0, 16),
    avatar: "🏴‍☠️",
    isHost: false,
    isBot: false,
    connected: true,
    score: 0,
    streak: 0,
    powerUps: [],
    chests: [],
    mutinied: false,
    marooned: false,
    maroonPending: false,
    jackpotEarned: false,
    rumRush: false,
    disabledOptions: [],
    cannonballed: false,
    poseidonUsed: false,
    ...opts,
  };
}

export function createRoom(code: string, host: ServerPlayer): ServerRoom {
  return {
    code,
    hostId: host.id,
    players: new Map([[host.id, host]]),
    phase: "lobby",
    config: { length: "test", rounds: [] },
    roundNumber: 0,
    totalRounds: 10,
    isEventRound: false,
    questionStartedAt: 0,
    questionDurationMs: 0,
    usedQuestionIds: new Set(),
    answers: new Map(),
    swordFights: [],
    revealEvents: [],
    timerEndsAt: 0,
    ticker: [],
    createdAt: Date.now(),
  };
}

/** Grant a starter power-up for testing? No — bags start empty; chests fill them. */
export function debugPowerUp(id: PowerUpId): OwnedPowerUp {
  return { uid: `pu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, powerUpId: id };
}
