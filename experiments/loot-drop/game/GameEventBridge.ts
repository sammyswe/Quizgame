import type { ItemUsedPayload, RevealPayload, RoomStatePublic } from "../../../shared/src/types";

/**
 * Two-way bridge between the React/network world and the Phaser scene.
 *
 * - Network pushes authoritative room state / reveal payloads in.
 * - The scene subscribes and renders them.
 * - The scene pushes player intents (allocate, lock, item use) out.
 *
 * The bridge caches the latest state so a scene that boots late (or restarts
 * after an asset-mode toggle) can catch up immediately.
 */

export interface InboundHandlers {
  onRoomState?: (state: RoomStatePublic) => void;
  onReveal?: (payload: RevealPayload) => void;
  onItem?: (payload: ItemUsedPayload) => void;
}

export interface OutboundHandlers {
  setLoot?: (allocations: number[]) => void;
  lockIn?: () => void;
  resetLoot?: () => void;
  useFearShot?: (targetPlayerId: string) => void;
}

class GameEventBridge {
  private inbound = new Set<InboundHandlers>();
  private outbound: OutboundHandlers = {};

  localPlayerId: string | null = null;
  lastRoomState: RoomStatePublic | null = null;
  lastReveal: RevealPayload | null = null;

  setLocalPlayerId(id: string | null): void {
    this.localPlayerId = id;
  }

  // ------------------------------------------------- network -> scene

  pushRoomState(state: RoomStatePublic): void {
    this.lastRoomState = state;
    this.inbound.forEach((h) => h.onRoomState?.(state));
  }

  pushReveal(payload: RevealPayload): void {
    this.lastReveal = payload;
    this.inbound.forEach((h) => h.onReveal?.(payload));
  }

  pushItem(payload: ItemUsedPayload): void {
    this.inbound.forEach((h) => h.onItem?.(payload));
  }

  subscribe(handlers: InboundHandlers): () => void {
    this.inbound.add(handlers);
    return () => this.inbound.delete(handlers);
  }

  // ------------------------------------------------- scene -> network

  onOutbound(handlers: OutboundHandlers): void {
    this.outbound = { ...this.outbound, ...handlers };
  }

  sendLoot(allocations: number[]): void {
    this.outbound.setLoot?.(allocations);
  }

  sendLockIn(): void {
    this.outbound.lockIn?.();
  }

  sendResetLoot(): void {
    this.outbound.resetLoot?.();
  }

  sendFearShot(targetPlayerId: string): void {
    this.outbound.useFearShot?.(targetPlayerId);
  }
}

export const gameEventBridge = new GameEventBridge();
