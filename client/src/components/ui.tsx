import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { PublicPlayer } from "@treasure-trap/shared";

/** Animated coin counter — scores never just "change", they tick. */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(value, { stiffness: 90, damping: 18 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);
  return <motion.span className={className}>{display}</motion.span>;
}

/** Phase countdown bar fed by server timestamp — everyone sees the same clock. */
export function TimerBar({ endsAt, className = "" }: { endsAt: number; className?: string }) {
  const [now, setNow] = useState(Date.now());
  const totalRef = useRef<number>(0);
  const endsRef = useRef<number>(0);
  const lastTickRef = useRef<number>(-1);
  if (endsAt !== endsRef.current) {
    endsRef.current = endsAt;
    totalRef.current = Math.max(1, endsAt - Date.now());
  }
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, endsAt - now);
  const seconds = Math.ceil(remaining / 1000);
  const urgent = seconds <= 5 && remaining > 0;

  // Tick sound each of the final 5 seconds.
  useEffect(() => {
    if (!urgent || seconds === lastTickRef.current) return;
    lastTickRef.current = seconds;
    void import("../lib/sfx").then(({ sfx }) => sfx.tick());
  }, [urgent, seconds]);

  if (!endsAt) return null;
  const pct = Math.min(100, (remaining / totalRef.current) * 100);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`h-3 flex-1 overflow-hidden rounded-full bg-white/10 ${urgent ? "animate-shake" : ""}`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${
            urgent
              ? "bg-gradient-to-r from-rose-500 to-red-400 shadow-neon-pink"
              : "bg-gradient-to-r from-cyan-400 to-sky-300 shadow-neon-cyan"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`w-9 text-right font-display text-xl tabular-nums ${
          urgent ? "animate-heartbeat text-neon-red" : "text-neon-cyan"
        }`}
        aria-label={`${seconds} seconds remaining`}
      >
        {seconds}
      </span>
    </div>
  );
}

export function PlayerChip({
  player,
  highlight = false,
  suffix,
}: {
  player: PublicPlayer;
  highlight?: boolean;
  suffix?: ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm ${
        highlight
          ? "border-neon-gold/60 bg-amber-400/10 shadow-neon-gold"
          : "border-white/10 bg-white/5"
      } ${player.connected ? "" : "opacity-40"}`}
    >
      <span aria-hidden>{player.avatar}</span>
      <span className="max-w-[9ch] truncate font-bold">{player.nickname}</span>
      {player.isBot && <span className="text-[10px] opacity-60">🤖</span>}
      {suffix}
    </div>
  );
}

/** Full-bleed screen wrapper with safe-area padding. */
export function Screen({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6 pb-6 pt-4 ${className}`}
      style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))", ...style }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-xl tracking-wide text-neon-gold text-outline">{children}</h2>
  );
}

/** Lightweight CSS confetti burst for wins. */
export function Confetti({ count = 40 }: { count?: number }) {
  const pieces = Array.from({ length: count }, (_, i) => i);
  const colors = ["#fbbf24", "#22d3ee", "#f472b6", "#4ade80", "#c084fc"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const duration = 2.2 + Math.random() * 1.6;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 8;
        return (
          <motion.div
            key={i}
            initial={{ y: -40, x: 0, rotate: 0, opacity: 1 }}
            animate={{
              y: "110vh",
              rotate: 360 * (Math.random() > 0.5 ? 2 : -2),
              opacity: [1, 1, 0.6],
            }}
            transition={{ duration, delay, ease: "easeIn" }}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: 0,
              width: size,
              height: size * 0.5,
              backgroundColor: color,
              borderRadius: 2,
            }}
          />
        );
      })}
    </div>
  );
}
