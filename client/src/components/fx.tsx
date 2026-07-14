import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Game-feel FX primitives: coin bursts, floating score deltas, emoji rains.
 * All are self-cleaning — mount them with a key and they fade out on their own.
 */

/** Radial burst of coins/emoji from the centre of its (relative) parent. */
export function EmojiBurst({
  emoji = "🪙",
  count = 10,
  distance = 90,
  duration = 0.8,
}: {
  emoji?: string;
  count?: number;
  distance?: number;
  duration?: number;
}) {
  const pieces = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    return {
      x: Math.cos(angle) * (distance * (0.6 + Math.random() * 0.6)),
      y: Math.sin(angle) * (distance * (0.5 + Math.random() * 0.5)) - 30,
      rotate: Math.random() * 360 - 180,
      scale: 0.7 + Math.random() * 0.7,
      delay: Math.random() * 0.08,
    };
  });
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      aria-hidden
    >
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl"
          initial={{ x: 0, y: 0, scale: 0.3, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: p.scale, rotate: p.rotate, opacity: [1, 1, 0] }}
          transition={{ duration, delay: p.delay, ease: "easeOut" }}
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
}

/** Floating "+100" that rises and fades from the centre of its parent. */
export function FloatingDelta({ value, icon = "🪙" }: { value: number; icon?: string }) {
  const positive = value > 0;
  return (
    <motion.div
      className={`pointer-events-none absolute inset-x-0 top-1/2 z-30 flex justify-center font-display text-3xl ${
        positive ? "text-neon-green" : "text-neon-red"
      }`}
      initial={{ y: 0, opacity: 0, scale: 0.5 }}
      animate={{ y: -70, opacity: [0, 1, 1, 0], scale: [0.5, 1.3, 1.1, 1] }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      aria-hidden
    >
      <span className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
        {icon} {positive ? "+" : ""}
        {value}
      </span>
    </motion.div>
  );
}

/** Rain of emoji falling across the whole screen (winner/plunder moments). */
export function EmojiRain({
  emoji = "🪙",
  count = 24,
  duration = 3,
}: {
  emoji?: string;
  count?: number;
  duration?: number;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const left = (i * 137.5) % 100;
        const delay = (i * 0.13) % 1.4;
        const size = 16 + ((i * 7) % 20);
        return (
          <motion.span
            key={i}
            className="absolute"
            style={{ left: `${left}%`, top: -40, fontSize: size }}
            initial={{ y: 0, rotate: 0, opacity: 1 }}
            animate={{ y: "115vh", rotate: i % 2 === 0 ? 360 : -360, opacity: [1, 1, 0.7] }}
            transition={{
              duration: duration * (0.7 + ((i * 11) % 10) / 16),
              delay,
              ease: "easeIn",
            }}
          >
            {emoji}
          </motion.span>
        );
      })}
    </div>
  );
}

/** Wraps children; triggers a CSS shake whenever `trigger` changes to a truthy value. */
export function Shaker({ trigger, children }: { trigger: unknown; children: ReactNode }) {
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 520);
    return () => clearTimeout(t);
  }, [trigger]);
  return <div className={shaking ? "animate-shake" : undefined}>{children}</div>;
}

/** "LOCKED IN" ink stamp overlay. */
export function LockStamp({ text = "LOCKED IN" }: { text?: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      aria-hidden
    >
      <div className="animate-stamp rounded-lg border-4 border-neon-gold/90 bg-black/30 px-4 py-1 font-display text-2xl tracking-widest text-neon-gold shadow-neon-gold backdrop-blur-[1px]">
        {text}
      </div>
    </div>
  );
}
