/**
 * Shared types between client and server.
 * The server is authoritative for all of this state; the client renders it.
 */

export const LOOT_PER_QUESTION = 100;
export const LOOT_STEP = 10;
export const ISLAND_COUNT = 4;
export const QUESTIONS_PER_GAME = 5;
export const ALLOCATION_SECONDS = 45;

export type Phase = "lobby" | "allocating" | "reveal" | "intermission" | "gameOver";

export type AvatarReaction =
  | "idle"
  | "thinking"
  | "locked"
  | "happy"
  | "shocked"
  | "angry"
  | "scared"
  | "winner";

export interface PlayerPublic {
  id: string;
  nickname: string;
  /** 0-7, picks one of the pirate avatar looks */
  avatarId: number;
  score: number;
  lockedIn: boolean;
  connected: boolean;
  isBot: boolean;
  isHost: boolean;
  /** Total loot the player has allocated so far this question (exact split stays private). */
  allocationTotal: number;
  /**
   * Island index the player put the most loot on. Only exposed once the
   * player has locked in ("confidence flag"), otherwise null.
   */
  flagIsland: number | null;
  /** True while the player is under a Fear Shot effect (visual). */
  scared: boolean;
  /** True if the player still holds their Fear Shot item this question. */
  hasItem: boolean;
}

export interface QuestionPublic {
  /** 0-based index of the current question */
  index: number;
  total: number;
  text: string;
  options: string[];
  /** Epoch ms when the allocation phase ends */
  endsAt: number;
}

export interface RoomStatePublic {
  code: string;
  phase: Phase;
  hostId: string;
  players: PlayerPublic[];
  question: QuestionPublic | null;
}

export interface RevealResultEntry {
  playerId: string;
  /** exact split the player had committed, per island */
  allocations: number[];
  /** loot returned from the correct island (doubled payout already applied) */
  gained: number;
  /** loot plundered from wrong islands */
  lost: number;
  newScore: number;
}

export interface RevealPayload {
  correctIndex: number;
  results: RevealResultEntry[];
  leaderboard: { playerId: string; nickname: string; score: number }[];
  /** Total loot (all players) that sat on each island, for plunder animation sizing */
  islandTotals: number[];
}

export interface ItemUsedPayload {
  type: "fearShot";
  fromId: string;
  targetId: string;
}

export interface JoinAck {
  ok: boolean;
  error?: string;
  playerId?: string;
  code?: string;
  state?: RoomStatePublic;
}

export interface ClientToServerEvents {
  "room:create": (nickname: string, cb: (ack: JoinAck) => void) => void;
  "room:join": (code: string, nickname: string, cb: (ack: JoinAck) => void) => void;
  "game:start": () => void;
  "game:again": () => void;
  /** Full allocation array (length 4, multiples of 10, sum <= 100). */
  "loot:set": (allocations: number[]) => void;
  "loot:lock": () => void;
  "loot:reset": () => void;
  "item:fearShot": (targetPlayerId: string) => void;
  "debug:addBot": () => void;
  "debug:skipTimer": () => void;
  "debug:forceReveal": () => void;
  "debug:grantItem": () => void;
}

export interface ServerToClientEvents {
  state: (state: RoomStatePublic) => void;
  reveal: (payload: RevealPayload) => void;
  item: (payload: ItemUsedPayload) => void;
}

export function emptyAllocations(): number[] {
  return new Array(ISLAND_COUNT).fill(0);
}

export function allocationsValid(allocations: number[]): boolean {
  if (!Array.isArray(allocations) || allocations.length !== ISLAND_COUNT) return false;
  let sum = 0;
  for (const a of allocations) {
    if (typeof a !== "number" || !Number.isFinite(a) || a < 0 || a % LOOT_STEP !== 0) return false;
    sum += a;
  }
  return sum <= LOOT_PER_QUESTION;
}
