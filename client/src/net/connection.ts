import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ItemUsedPayload,
  RevealPayload,
  RoomStatePublic,
  ServerToClientEvents,
} from "../../../shared/src/types";
import { gameEventBridge } from "../game/GameEventBridge";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

export interface NetState {
  status: ConnectionStatus;
  error: string | null;
  playerId: string | null;
  room: RoomStatePublic | null;
}

type Listener = () => void;

const SERVER_URL =
  (import.meta.env.VITE_SERVER_URL as string | undefined) ??
  `${location.protocol}//${location.hostname}:3001`;

class Connection {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private listeners = new Set<Listener>();
  private state: NetState = { status: "idle", error: null, playerId: null, room: null };

  getState = (): NetState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private setState(partial: Partial<NetState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l());
  }

  private ensureSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket) return this.socket;
    this.setState({ status: "connecting" });
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
      transports: ["websocket", "polling"],
    });
    socket.on("connect", () => this.setState({ status: "connected", error: null }));
    socket.on("connect_error", (err) =>
      this.setState({ status: "error", error: `Cannot reach server (${err.message})` }),
    );
    socket.on("disconnect", () => this.setState({ status: "connecting" }));
    socket.on("state", (room: RoomStatePublic) => {
      this.setState({ room });
      gameEventBridge.pushRoomState(room);
    });
    socket.on("reveal", (payload: RevealPayload) => {
      gameEventBridge.pushReveal(payload);
    });
    socket.on("item", (payload: ItemUsedPayload) => {
      gameEventBridge.pushItem(payload);
    });
    this.socket = socket;
    return socket;
  }

  createRoom(nickname: string): Promise<void> {
    return new Promise((resolve) => {
      this.ensureSocket().emit("room:create", nickname, (ack) => {
        if (ack.ok && ack.state) {
          this.setState({ playerId: ack.playerId ?? null, room: ack.state, error: null });
          gameEventBridge.setLocalPlayerId(ack.playerId ?? null);
          gameEventBridge.pushRoomState(ack.state);
        } else {
          this.setState({ error: ack.error ?? "Could not create room" });
        }
        resolve();
      });
    });
  }

  joinRoom(code: string, nickname: string): Promise<void> {
    return new Promise((resolve) => {
      this.ensureSocket().emit("room:join", code, nickname, (ack) => {
        if (ack.ok && ack.state) {
          this.setState({ playerId: ack.playerId ?? null, room: ack.state, error: null });
          gameEventBridge.setLocalPlayerId(ack.playerId ?? null);
          gameEventBridge.pushRoomState(ack.state);
        } else {
          this.setState({ error: ack.error ?? "Could not join room" });
        }
        resolve();
      });
    });
  }

  emit<E extends keyof ClientToServerEvents>(event: E, ...args: Parameters<ClientToServerEvents[E]>): void {
    this.socket?.emit(event, ...args);
  }

  clearError(): void {
    this.setState({ error: null });
  }
}

export const connection = new Connection();

// Actions coming out of the Phaser scene get forwarded to the server here.
gameEventBridge.onOutbound({
  setLoot: (allocations) => connection.emit("loot:set", allocations),
  lockIn: () => connection.emit("loot:lock"),
  resetLoot: () => connection.emit("loot:reset"),
  useFearShot: (targetId) => connection.emit("item:fearShot", targetId),
});
