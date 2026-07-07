import type {
  Accusation,
  ActiveEffect,
  ActiveMission,
  Answer,
  Chest,
  ChaseState,
  FinalActionId,
  GameConfig,
  ObscureQuestion,
  OwnedItem,
  Pact,
  PairState,
  Phase,
  PlunderChoice,
  Question,
  RevealEvent,
  RoundId,
} from "@treasure-trap/shared";
import type { AuctionLot } from "@treasure-trap/shared";

/** Full server-side player. Only sanitised slices ever leave the server. */
export type ServerPlayer = {
  id: string;
  socketId?: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  isBot: boolean;
  connected: boolean;
  /** Banked score — safe from most attacks. */
  score: number;
  /** Unbanked loot earned this round — vulnerable until the leaderboard banks it. */
  roundLoot: number;
  streak: number;
  mutinyTokens: number;
  items: OwnedItem[];
  chests: Chest[];
  mission?: ActiveMission;
  /** Double Agent: absorbs one accusation or Fear Shot. */
  agentShield: boolean;
  /** Rum Rush pending on next correct answer. */
  rumRush: boolean;
  /** Auction: double reward if correct next question. */
  doubleReward: boolean;
  /** Auction: strongbox protects roundLoot from swaps/wrecks this round. */
  lootProtected: boolean;
  /** Spyglass / Spy the Deck: wrong options hidden for this player. */
  disabledOptions: number[];
  privateClue?: string;
  /** Sabotage: answer is locked. */
  answerLocked: boolean;
  finalActionsOffered?: FinalActionId[];
  finalChoice?: { actionId: FinalActionId; targetId?: string };
  pairChoice?: PlunderChoice;
};

export type ServerRoom = {
  code: string;
  hostId: string;
  players: Map<string, ServerPlayer>;
  phase: Phase;
  config: GameConfig;
  roundPlan: RoundId[];
  roundIndex: number;
  /** 1-based question number within the round. */
  questionNumber: number;
  currentQuestion?: Question;
  currentObscure?: ObscureQuestion;
  usedQuestionIds: Set<string>;
  answers: Map<string, Answer>;
  effects: ActiveEffect[];
  accusations: Accusation[];
  pacts: Pact[];
  auction?: {
    lot: AuctionLot;
    bids: Map<string, { amount: number; at: number }>;
  };
  falseMap?: { captainIds: string[]; trueCaptainId: string };
  pairs?: PairState[];
  chase?: ChaseState;
  revealEvents: RevealEvent[];
  timer?: ReturnType<typeof setTimeout>;
  /** The continuation scheduled for the current phase — skipTimer runs it early. */
  onPhaseEnd?: () => void;
  timerEndsAt: number;
  ticker: string[];
  winnerId?: string;
  /** Underdog checkpoint chests already handed out (round indexes). */
  underdogRounds: Set<number>;
  createdAt: number;
};

const AVATAR_POOL = ["🦜", "🐙", "🦈", "🐢", "🦑", "🦀", "🦞", "🐡", "🐬", "🐋"];

export function nextAvatar(room: Pick<ServerRoom, "players">): string {
  const used = new Set([...room.players.values()].map((p) => p.avatar));
  return AVATAR_POOL.find((a) => !used.has(a)) ?? "🏴‍☠️";
}

export function createPlayer(id: string, nickname: string, opts: Partial<ServerPlayer> = {}): ServerPlayer {
  return {
    id,
    nickname: nickname.slice(0, 16),
    avatar: "🏴‍☠️",
    isHost: false,
    isBot: false,
    connected: true,
    score: 0,
    roundLoot: 0,
    streak: 0,
    mutinyTokens: 1,
    items: [],
    chests: [],
    agentShield: false,
    rumRush: false,
    doubleReward: false,
    lootProtected: false,
    disabledOptions: [],
    answerLocked: false,
    ...opts,
  };
}

export function createRoom(code: string, host: ServerPlayer): ServerRoom {
  return {
    code,
    hostId: host.id,
    players: new Map([[host.id, host]]),
    phase: "lobby",
    config: { length: "short", rounds: [] },
    roundPlan: [],
    roundIndex: -1,
    questionNumber: 0,
    usedQuestionIds: new Set(),
    answers: new Map(),
    effects: [],
    accusations: [],
    pacts: [],
    revealEvents: [],
    timerEndsAt: 0,
    ticker: [],
    underdogRounds: new Set(),
    createdAt: Date.now(),
  };
}
