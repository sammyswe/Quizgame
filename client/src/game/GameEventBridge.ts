import type {
  PrivatePlayerState,
  PublicGameState,
  QuestionResult,
  PowerUpId,
} from "@treasure-trap/shared";

export type TargetingIntent = { uid: string; powerUpId: PowerUpId };
export type FiredPowerUp = {
  key: number;
  byId: string;
  targetIds: string[];
  powerUpId: PowerUpId;
};

export type GameSnapshot = {
  game?: PublicGameState;
  priv?: PrivatePlayerState;
  playerId?: string;
  result?: QuestionResult & { key: number };
  targeting?: TargetingIntent;
  fired?: FiredPowerUp;
};

type Listener = (snapshot: GameSnapshot) => void;

export type GameIntent =
  | { type: "answer"; choiceIndex: number }
  | { type: "loot"; allocation: number[] }
  | { type: "mutiny" }
  | { type: "powerup"; uid: string; targetId?: string }
  | { type: "chest"; uid: string }
  | { type: "advance" }
  | { type: "clearTargeting" };

class GameEventBridge {
  private listeners = new Set<Listener>();
  private intentHandler?: (intent: GameIntent) => void;
  private snapshot: GameSnapshot = {};

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  push(next: GameSnapshot): void {
    this.snapshot = next;
    for (const listener of this.listeners) listener(this.snapshot);
  }

  setIntentHandler(handler: (intent: GameIntent) => void): () => void {
    this.intentHandler = handler;
    return () => {
      if (this.intentHandler === handler) this.intentHandler = undefined;
    };
  }

  send(intent: GameIntent): void {
    this.intentHandler?.(intent);
  }

  get current(): GameSnapshot {
    return this.snapshot;
  }
}

export const gameEventBridge = new GameEventBridge();
