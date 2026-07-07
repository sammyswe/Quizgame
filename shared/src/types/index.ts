// ---------------------------------------------------------------------------
// Treasure Trap — shared types used by both client and server.
// Keep this file the single source of truth for the data model.
// ---------------------------------------------------------------------------

// ----- Questions -----------------------------------------------------------

export type Category = "general" | "geography" | "science" | "sport" | "culture";
export type Difficulty = "easy" | "medium" | "hard";

export type Question = {
  id: string;
  category: Category;
  prompt: string;
  options: string[];
  correctIndex: number;
  difficulty: Difficulty;
  tags?: string[];
};

/** Obscure Island questions can have multiple correct options + one Fool's Gold trap. */
export type ObscureOption = {
  text: string;
  correct: boolean;
  /** Looks obscure/clever but is wrong. */
  foolsGold?: boolean;
};

export type ObscureQuestion = {
  id: string;
  prompt: string;
  options: ObscureOption[];
};

/** What clients see during the question phase (no correctIndex!). */
export type PublicQuestion = {
  id: string;
  category: Category | "obscure";
  prompt: string;
  options: string[];
  difficulty: Difficulty;
};

// ----- Rounds ---------------------------------------------------------------

export type RoundId =
  | "lootDrop"
  | "treasureAuction"
  | "falseMap"
  | "obscureIsland"
  | "splitOrPlunder"
  | "captainsChase"
  | "finalPlunder";

export type GameLength = "short" | "medium" | "full";

export type GameConfig = {
  length: GameLength;
  rounds: RoundId[];
};

// ----- Phases ---------------------------------------------------------------

export type Phase =
  | "lobby"
  | "setup"
  | "round_intro"
  | "auction" // Treasure Auction secret bidding
  | "final_action" // Final Plunder action pick
  | "question" // answering + discussion (includes Loot Drop allocation)
  | "pair_choice" // Split or Plunder secret choice
  | "reveal"
  | "leaderboard"
  | "winner";

// ----- Items ----------------------------------------------------------------

export type Rarity = "common" | "rare" | "epic" | "legendary";

export type ItemId =
  | "copycat"
  | "spyglass"
  | "luckyDoubloon"
  | "fearShot"
  | "rumRush"
  | "sabotage"
  | "sneaksMap"
  | "treasureSwitch"
  | "backstab"
  | "doubleAgent"
  | "shipwreck"
  | "crownHeist"
  | "broadsideDuel"
  | "blackSpot"
  | "captainsCurse";

export type ItemTiming = "prep" | "question" | "lock" | "reveal" | "final";

export type ItemTargetRule =
  "none" | "self" | "otherPlayer" | "anyPlayer" | "higherRanked" | "wrongOption";

export type ItemDef = {
  id: ItemId;
  name: string;
  icon: string;
  rarity: Rarity;
  description: string;
  timing: ItemTiming;
  target: ItemTargetRule;
  counterplay: string;
  /** True when the item is an attack that Captain's Curse can reverse. */
  isAttack: boolean;
  /** Simplified in v1? Documented in docs/GAME_DESIGN.md. */
  simplified?: boolean;
};

/** An item instance owned by a player. */
export type OwnedItem = {
  uid: string;
  itemId: ItemId;
};

/** An item played this question, waiting to resolve at reveal. */
export type ActiveEffect = {
  uid: string;
  itemId: ItemId;
  byId: string;
  targetId?: string;
  /** e.g. trap option index for Sneak's Map. */
  optionIndex?: number;
};

// ----- Chests ---------------------------------------------------------------

export type ChestSource =
  | "sunken"
  | "captains"
  | "betrayal"
  | "mutiny"
  | "survivor"
  | "streak"
  | "underdog"
  | "auction"
  | "honour"
  | "revenge"
  | "debug";

export type Chest = {
  uid: string;
  source: ChestSource;
  earnedAtRound: number;
};

// ----- Secret missions -------------------------------------------------------

export type MissionId =
  | "falseFriend"
  | "piedPiper"
  | "honestCaptain"
  | "snakeOil"
  | "loudLiar"
  | "fakePanic"
  | "saveTheSucker"
  | "pirateProphet"
  | "mutinyBait"
  | "loneTreasure"
  | "herdTrap"
  | "doubleCross";

export type MissionDef = {
  id: MissionId;
  name: string;
  icon: string;
  description: string;
  /** Deceptive missions can be caught by a Mutiny accusation. */
  deceptive: boolean;
  /** Fully auto-resolved by the engine in v1. */
  implemented: boolean;
  /** Player must pick a target player when the mission is live. */
  needsTarget?: boolean;
  /** Player must pick a trap option when the mission is live. */
  needsOption?: boolean;
};

export type ActiveMission = {
  missionId: MissionId;
  targetId?: string;
  optionIndex?: number;
  /** Blocked by Fear Shot or a correct accusation. */
  blocked?: boolean;
};

// ----- Answers / allocations --------------------------------------------------

export type Answer = {
  playerId: string;
  choiceIndex?: number;
  /** Loot Drop: loot placed on each of the 4 islands, sums to <= LOOT_POOL. */
  lootAllocation?: number[];
  lockedAt: number;
  /** Confidence token placed publicly (Loot Drop). */
  confident?: boolean;
};

export type LootAllocation = number[];

// ----- Auction ----------------------------------------------------------------

export type AuctionPrizeId =
  "spyglass" | "mysteryChest" | "doubleReward" | "privateClue" | "protectLoot" | "cursedLot";

export type AuctionState = {
  prizeId: AuctionPrizeId;
  prizeName: string;
  prizeIcon: string;
  prizeDescription: string;
  /** Bids stay secret until reveal. Server-only field mirrored as bidsIn count. */
  bidsIn: string[];
  winnerId?: string;
  winningBid?: number;
};

// ----- Pacts & accusations ------------------------------------------------------

export type Pact = {
  fromId: string;
  toId: string;
  accepted: boolean;
};

export type Accusation = {
  accuserId: string;
  accusedId: string;
  correct?: boolean;
};

// ----- Split or Plunder ----------------------------------------------------------

export type PlunderChoice = "split" | "plunder" | "guard";

export type PairState = {
  aId: string;
  bId: string;
  /** Both correct answers make the pot bigger. */
  potSize: number;
};

// ----- Captain's Chase ------------------------------------------------------------

export type ChaseState = {
  captainId: string;
  /** Track positions, 0..CHASE_TRACK_LENGTH. Captain starts ahead. */
  positions: Record<string, number>;
  questionNumber: number;
  totalQuestions: number;
  caughtBy?: string;
};

// ----- Final Plunder ---------------------------------------------------------------

export type FinalActionId =
  | "bankTheBooty"
  | "captainsShield"
  | "captainsCurse"
  | "bodyguard"
  | "raiseTheBlackFlag"
  | "lastCannon"
  | "crownHeist"
  | "falseTreasure"
  | "followMe"
  | "betrayTheCrew"
  | "allInPlunder"
  | "spyTheDeck"
  | "blameGame"
  | "cursedChest"
  | "doubleCross";

export type FinalActionDef = {
  id: FinalActionId;
  name: string;
  icon: string;
  description: string;
  needsTarget: boolean;
  /** Which leaderboard tier gets offered this action. */
  tiers: Array<"leader" | "middle" | "bottom">;
  simplified?: boolean;
};

export type FinalPlunderState = {
  questionNumber: number; // 1..3
  totalQuestions: number;
  /** playerIds that have picked their final action this question. */
  actionsIn: string[];
};

// ----- Reveal events ----------------------------------------------------------------

export type RevealEventType =
  | "correctAnswer"
  | "lootPlundered"
  | "itemTriggered"
  | "itemBlocked"
  | "missionSuccess"
  | "missionFailed"
  | "accusationCorrect"
  | "accusationWrong"
  | "scoreChanged"
  | "chestEarned"
  | "leaderboardChanged"
  | "auctionResult"
  | "pairResult"
  | "chaseMove"
  | "finalAction";

export type RevealEvent = {
  id: string;
  type: RevealEventType;
  title: string;
  description: string;
  icon?: string;
  playerIds?: string[];
  pointsDelta?: Record<string, number>;
};

export type ScoreChange = {
  playerId: string;
  delta: number;
  reason: string;
};

// ----- Players -----------------------------------------------------------------------

export type PublicPlayer = {
  id: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  isBot: boolean;
  connected: boolean;
  score: number;
  /** Unbanked loot earned this round — vulnerable to steals until banked at leaderboard. */
  roundLoot: number;
  chestCount: number;
  itemCount: number;
  streak: number;
  mutinyTokens: number;
  hasAnswered: boolean;
  confident?: boolean;
  rank: number;
};

export type PrivatePlayerState = {
  playerId: string;
  items: OwnedItem[];
  chests: Chest[];
  mission?: ActiveMission & { def: MissionDef };
  /** Spyglass: option indexes greyed out for this player. */
  disabledOptions?: number[];
  /** Private clue text (auction prize / False Map captain info). */
  privateClue?: string;
  /** Final Plunder: the 3 actions offered this question. */
  finalActions?: FinalActionId[];
  /** Answer currently locked by sabotage. */
  answerLocked?: boolean;
  /** Chosen final action (echo). */
  chosenFinalAction?: FinalActionId;
};

// ----- Room / game state ----------------------------------------------------------------

export type FalseMapInfo = {
  /** The two announced captains. One holds a true clue, one a false clue. */
  captainIds: string[];
};

export type PublicGameState = {
  roomCode: string;
  phase: Phase;
  config: GameConfig;
  roundPlan: RoundId[];
  roundIndex: number;
  currentRound?: RoundId;
  questionNumber: number;
  totalQuestionsInRound: number;
  question?: PublicQuestion;
  /** Epoch ms when the current phase timer expires (0 = no timer). */
  timerEndsAt: number;
  players: PublicPlayer[];
  revealEvents: RevealEvent[];
  auction?: AuctionState;
  falseMap?: FalseMapInfo;
  pairs?: PairState[];
  chase?: ChaseState;
  finalPlunder?: FinalPlunderState;
  winnerId?: string;
  /** Public log line ticker, e.g. "Bones played an item!" */
  ticker: string[];
};

// ----- Socket protocol -------------------------------------------------------------------

export type ClientEvents = {
  "room:create": (
    nickname: string,
    cb: (res: Ack<{ roomCode: string; playerId: string }>) => void,
  ) => void;
  "room:join": (
    roomCode: string,
    nickname: string,
    cb: (res: Ack<{ roomCode: string; playerId: string }>) => void,
  ) => void;
  "room:rejoin": (roomCode: string, playerId: string, cb: (res: Ack<{ ok: true }>) => void) => void;
  "game:configure": (config: GameConfig) => void;
  "game:start": () => void;
  "answer:submit": (payload: {
    choiceIndex?: number;
    lootAllocation?: number[];
    confident?: boolean;
  }) => void;
  "loot:allocate": (allocation: number[]) => void;
  "item:use": (payload: { uid: string; targetId?: string; optionIndex?: number }) => void;
  "chest:open": (uid: string) => void;
  "auction:bid": (amount: number) => void;
  "pact:offer": (targetId: string) => void;
  "pact:accept": (fromId: string) => void;
  "mutiny:accuse": (targetId: string) => void;
  "mission:setup": (payload: { targetId?: string; optionIndex?: number }) => void;
  "pair:choose": (choice: PlunderChoice) => void;
  "final:action": (payload: { actionId: FinalActionId; targetId?: string }) => void;
  "phase:advance": () => void;
  "game:playAgain": () => void;
  "debug:addBot": () => void;
  "debug:skipTimer": () => void;
  "debug:forceChest": (rarity?: Rarity) => void;
  "debug:reset": () => void;
  "debug:autoAnswer": () => void;
  "debug:getState": (cb: (state: unknown) => void) => void;
};

export type ServerEvents = {
  "room:state": (state: PublicGameState) => void;
  "game:state": (state: PublicGameState) => void;
  "player:privateState": (state: PrivatePlayerState) => void;
  "phase:changed": (phase: Phase) => void;
  "reveal:events": (events: RevealEvent[]) => void;
  "chest:opened": (result: {
    uid: string;
    rarity: Rarity;
    item: OwnedItem;
    itemDef: ItemDef;
  }) => void;
  toast: (msg: { icon?: string; text: string }) => void;
  error: (message: string) => void;
};

export type Ack<T> = { ok: true; data: T } | { ok: false; error: string };
