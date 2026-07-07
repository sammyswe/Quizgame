import { create } from "zustand";
import type {
  Ack,
  ItemDef,
  OwnedItem,
  PrivatePlayerState,
  PublicGameState,
  PublicPlayer,
  Rarity,
} from "@treasure-trap/shared";
import { emitWithAck, socket } from "../net/socket";

export type Toast = { id: number; icon?: string; text: string };

export type ChestReveal = {
  rarity: Rarity;
  item: OwnedItem;
  itemDef: ItemDef;
};

type GameStore = {
  connected: boolean;
  roomCode?: string;
  playerId?: string;
  game?: PublicGameState;
  priv?: PrivatePlayerState;
  toasts: Toast[];
  chestReveal?: ChestReveal;
  joinError?: string;

  me: () => PublicPlayer | undefined;
  isHost: () => boolean;

  createRoom: (nickname: string) => Promise<boolean>;
  joinRoom: (roomCode: string, nickname: string) => Promise<boolean>;
  leave: () => void;
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
  clearChestReveal: () => void;
};

let toastId = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  connected: false,
  toasts: [],

  me: () => {
    const { game, playerId } = get();
    return game?.players.find((p) => p.id === playerId);
  },

  isHost: () => {
    const me = get().me();
    return Boolean(me?.isHost);
  },

  createRoom: async (nickname: string) => {
    const res = await emitWithAck<Ack<{ roomCode: string; playerId: string }>>(
      "room:create",
      nickname,
    );
    if (res.ok) {
      set({ roomCode: res.data.roomCode, playerId: res.data.playerId, joinError: undefined });
      persistSession(res.data.roomCode, res.data.playerId);
      return true;
    }
    set({ joinError: res.error });
    return false;
  },

  joinRoom: async (roomCode: string, nickname: string) => {
    const res = await emitWithAck<Ack<{ roomCode: string; playerId: string }>>(
      "room:join",
      roomCode,
      nickname,
    );
    if (res.ok) {
      set({ roomCode: res.data.roomCode, playerId: res.data.playerId, joinError: undefined });
      persistSession(res.data.roomCode, res.data.playerId);
      return true;
    }
    set({ joinError: res.error });
    return false;
  },

  leave: () => {
    sessionStorage.removeItem("tt-session");
    set({ roomCode: undefined, playerId: undefined, game: undefined, priv: undefined });
    window.location.reload();
  },

  pushToast: (toast) => {
    toastId += 1;
    const t = { ...toast, id: toastId };
    set((s) => ({ toasts: [...s.toasts.slice(-3), t] }));
    setTimeout(() => get().dismissToast(t.id), 4200);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  clearChestReveal: () => set({ chestReveal: undefined }),
}));

function persistSession(roomCode: string, playerId: string): void {
  sessionStorage.setItem("tt-session", JSON.stringify({ roomCode, playerId }));
}

// ----- Socket wiring ---------------------------------------------------------

socket.on("connect", async () => {
  useGameStore.setState({ connected: true });
  // Attempt to rejoin after refresh/reconnect.
  const raw = sessionStorage.getItem("tt-session");
  const state = useGameStore.getState();
  if (raw && !state.game) {
    try {
      const { roomCode, playerId } = JSON.parse(raw) as { roomCode: string; playerId: string };
      const res = await emitWithAck<Ack<{ ok: true }>>("room:rejoin", roomCode, playerId);
      if (res.ok) {
        useGameStore.setState({ roomCode, playerId });
      } else {
        sessionStorage.removeItem("tt-session");
      }
    } catch {
      sessionStorage.removeItem("tt-session");
    }
  }
});

socket.on("disconnect", () => useGameStore.setState({ connected: false }));

socket.on("game:state", (game: PublicGameState) => {
  useGameStore.setState({ game });
});

socket.on("player:privateState", (priv: PrivatePlayerState) => {
  useGameStore.setState({ priv });
});

socket.on("toast", (msg: { icon?: string; text: string }) => {
  useGameStore.getState().pushToast(msg);
});

socket.on("chest:opened", (reveal: ChestReveal) => {
  useGameStore.setState({ chestReveal: reveal });
});

socket.on("error", (message: string) => {
  useGameStore.getState().pushToast({ icon: "⚠️", text: message });
});
