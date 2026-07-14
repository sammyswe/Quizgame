import { gameSettings } from "../settings";

export type SoundEvent =
  | "coinPlace"
  | "lockIn"
  | "revealStart"
  | "correctIsland"
  | "plunder"
  | "cannonFire"
  | "scoreGain"
  | "chestEarned"
  | "itemUse"
  | "avatarReact";

/**
 * Tiny synthesized audio bus. No sound files exist yet, so each event maps to
 * a short Web Audio blip. Replace the synth with real samples later without
 * changing any call sites -- game code only ever calls soundEventBus.emit().
 */
class SoundEventBus {
  private ctx: AudioContext | null = null;

  private ensureCtx(): AudioContext | null {
    if (typeof AudioContext === "undefined") return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  emit(event: SoundEvent): void {
    if (!gameSettings.soundEnabled) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const spec = BLIPS[event];
    if (!spec) return;
    try {
      spec.forEach(([freq, start, dur, type, gain]) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        g.gain.setValueAtTime(gain, ctx.currentTime + start);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
        osc.connect(g).connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur + 0.02);
      });
    } catch {
      // audio is strictly best-effort
    }
  }
}

type Blip = [freq: number, start: number, dur: number, type: OscillatorType, gain: number];

const BLIPS: Record<SoundEvent, Blip[]> = {
  coinPlace: [
    [880, 0, 0.07, "triangle", 0.06],
    [1320, 0.05, 0.08, "triangle", 0.05],
  ],
  lockIn: [
    [180, 0, 0.12, "square", 0.07],
    [90, 0.08, 0.18, "square", 0.08],
  ],
  revealStart: [
    [440, 0, 0.1, "sawtooth", 0.04],
    [550, 0.1, 0.1, "sawtooth", 0.04],
    [660, 0.2, 0.16, "sawtooth", 0.05],
  ],
  correctIsland: [
    [660, 0, 0.1, "triangle", 0.06],
    [880, 0.09, 0.1, "triangle", 0.06],
    [1100, 0.18, 0.2, "triangle", 0.07],
  ],
  plunder: [
    [220, 0, 0.15, "sawtooth", 0.06],
    [160, 0.1, 0.22, "sawtooth", 0.06],
  ],
  cannonFire: [
    [70, 0, 0.25, "square", 0.1],
    [45, 0.04, 0.3, "sine", 0.1],
  ],
  scoreGain: [
    [990, 0, 0.06, "triangle", 0.05],
    [1180, 0.05, 0.06, "triangle", 0.05],
    [1400, 0.1, 0.09, "triangle", 0.05],
  ],
  chestEarned: [
    [520, 0, 0.12, "triangle", 0.06],
    [780, 0.1, 0.12, "triangle", 0.06],
    [1040, 0.2, 0.24, "triangle", 0.07],
  ],
  itemUse: [
    [300, 0, 0.1, "sawtooth", 0.06],
    [200, 0.08, 0.16, "sawtooth", 0.06],
  ],
  avatarReact: [[740, 0, 0.08, "triangle", 0.04]],
};

export const soundEventBus = new SoundEventBus();
