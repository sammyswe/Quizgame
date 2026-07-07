/**
 * Tiny synthesized sound engine — no audio assets needed.
 * Every game event gets audible feedback; players can mute (persisted).
 * The AudioContext is created lazily on the first user gesture to satisfy
 * browser autoplay policies.
 */

let ctx: AudioContext | undefined;
let muted = localStorage.getItem("tt-muted") === "1";

function ac(): AudioContext | undefined {
  if (muted) return undefined;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return undefined;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(m: boolean): void {
  muted = m;
  localStorage.setItem("tt-muted", m ? "1" : "0");
}

type ToneOpts = {
  freq: number;
  /** seconds */
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  /** delay from now, seconds */
  at?: number;
  /** pitch slide target */
  slideTo?: number;
};

function tone({ freq, dur = 0.12, type = "square", gain = 0.06, at = 0, slideTo }: ToneOpts): void {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + at;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur = 0.15, gain = 0.05, at = 0): void {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + at;
  const buffer = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buffer;
  const g = a.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const filter = a.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  src.connect(filter).connect(g).connect(a.destination);
  src.start(t0);
}

// ---- Game sounds ------------------------------------------------------------

export const sfx = {
  /** Hovering/considering an answer. */
  tap(): void {
    tone({ freq: 520, dur: 0.05, type: "sine", gain: 0.04 });
  },

  /** Answer selected / choice made. */
  select(): void {
    tone({ freq: 440, dur: 0.07, type: "triangle", gain: 0.07 });
    tone({ freq: 660, dur: 0.09, type: "triangle", gain: 0.06, at: 0.05 });
  },

  /** Answer locked in — a solid thunk. */
  lock(): void {
    tone({ freq: 220, dur: 0.12, type: "square", gain: 0.08 });
    tone({ freq: 110, dur: 0.16, type: "sine", gain: 0.09, at: 0.02 });
    noise(0.08, 0.03, 0.01);
  },

  /** Coins! Rising arpeggio. */
  coins(): void {
    [880, 1108, 1318, 1760].forEach((f, i) => {
      tone({ freq: f, dur: 0.09, type: "triangle", gain: 0.05, at: i * 0.06 });
    });
  },

  /** Losing loot — descending womp. */
  lose(): void {
    tone({ freq: 330, dur: 0.22, type: "sawtooth", gain: 0.05, slideTo: 140 });
    tone({ freq: 165, dur: 0.3, type: "sine", gain: 0.06, at: 0.08, slideTo: 80 });
  },

  /** Dramatic reveal sting. */
  sting(): void {
    tone({ freq: 196, dur: 0.14, type: "square", gain: 0.06 });
    tone({ freq: 392, dur: 0.14, type: "square", gain: 0.05, at: 0.1 });
    tone({ freq: 587, dur: 0.22, type: "square", gain: 0.05, at: 0.2 });
  },

  /** Big attack / betrayal — cannon boom. */
  boom(): void {
    tone({ freq: 90, dur: 0.35, type: "sine", gain: 0.14, slideTo: 40 });
    noise(0.3, 0.08);
  },

  /** Mutiny / alarm. */
  alarm(): void {
    tone({ freq: 622, dur: 0.12, type: "sawtooth", gain: 0.05 });
    tone({ freq: 466, dur: 0.12, type: "sawtooth", gain: 0.05, at: 0.13 });
    tone({ freq: 622, dur: 0.12, type: "sawtooth", gain: 0.05, at: 0.26 });
  },

  /** Chest opening — creak + shimmer. */
  chest(): void {
    tone({ freq: 130, dur: 0.3, type: "sawtooth", gain: 0.04, slideTo: 180 });
    [1046, 1318, 1568, 2093].forEach((f, i) => {
      tone({ freq: f, dur: 0.12, type: "sine", gain: 0.04, at: 0.3 + i * 0.07 });
    });
  },

  /** Legendary rarity hit. */
  legendary(): void {
    [523, 659, 784, 1046, 1318].forEach((f, i) => {
      tone({ freq: f, dur: 0.16, type: "triangle", gain: 0.06, at: i * 0.09 });
    });
  },

  /** Timer urgency tick. */
  tick(): void {
    tone({ freq: 1200, dur: 0.03, type: "sine", gain: 0.035 });
  },

  /** Round intro drum hit. */
  drum(): void {
    tone({ freq: 150, dur: 0.18, type: "sine", gain: 0.12, slideTo: 60 });
    noise(0.12, 0.05);
  },

  /** Winner fanfare. */
  fanfare(): void {
    const melody = [523, 523, 523, 659, 784, 659, 784, 1046];
    melody.forEach((f, i) => {
      tone({
        freq: f,
        dur: i === melody.length - 1 ? 0.5 : 0.14,
        type: "square",
        gain: 0.05,
        at: i * 0.15,
      });
      tone({ freq: f / 2, dur: 0.14, type: "triangle", gain: 0.04, at: i * 0.15 });
    });
  },

  /** Generic whoosh for screen transitions. */
  whoosh(): void {
    noise(0.18, 0.03);
    tone({ freq: 300, dur: 0.16, type: "sine", gain: 0.03, slideTo: 700 });
  },
};
