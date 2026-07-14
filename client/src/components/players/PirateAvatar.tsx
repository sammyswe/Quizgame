import { motion } from "framer-motion";
import { avatarFrame } from "../../lib/higgsfield";
import { HfSprite } from "../higgsfield/HfSprite";

/**
 * Animated pirate avatar: Higgsfield reaction portrait (A6) inside a coloured
 * ring that keeps each player unique. `mood` swaps the expression frame.
 */
export type AvatarMood =
  | "idle"
  | "answered"
  | "nervous"
  | "attacked"
  | "protected"
  | "cursed"
  | "accused"
  | "winner";

const RING_COLORS = [
  "#22d3ee",
  "#fbbf24",
  "#f472b6",
  "#4ade80",
  "#c084fc",
  "#fb7185",
  "#38bdf8",
  "#fde047",
];

/** Stable colour per player id. */
export function avatarColor(playerId: string): string {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) hash = (hash * 31 + playerId.charCodeAt(i)) | 0;
  return RING_COLORS[Math.abs(hash) % RING_COLORS.length] ?? "#22d3ee";
}

const MOOD_RING: Record<AvatarMood, { color?: string; pulse: boolean; badge?: string }> = {
  idle: { pulse: false },
  answered: { color: "#4ade80", pulse: false, badge: "✅" },
  nervous: { pulse: true, badge: "💭" },
  attacked: { color: "#fb7185", pulse: true, badge: "💥" },
  protected: { color: "#22d3ee", pulse: true, badge: "🛡️" },
  cursed: { color: "#4ade80", pulse: true, badge: "☠️" },
  accused: { color: "#fb7185", pulse: true, badge: "⚔️" },
  winner: { color: "#fbbf24", pulse: true, badge: "👑" },
};

export function PirateAvatar({
  playerId,
  emoji: _emoji,
  size = 44,
  mood = "idle",
  bobDelay = 0,
}: {
  playerId: string;
  emoji: string;
  size?: number;
  mood?: AvatarMood;
  bobDelay?: number;
}) {
  const base = avatarColor(playerId);
  const moodCfg = MOOD_RING[mood];
  const ring = moodCfg.color ?? base;
  const wobble = mood === "nervous" || mood === "attacked";

  return (
    <motion.div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size + 8 }}
      animate={wobble ? { rotate: [-4, 4, -4], y: [0, -1, 0] } : { y: [0, -3, 0] }}
      transition={{
        repeat: Infinity,
        duration: wobble ? 0.5 : 2.8,
        delay: bobDelay,
        ease: "easeInOut",
      }}
    >
      <motion.div
        className="absolute bottom-0 overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          border: `2.5px solid ${ring}`,
          background: `radial-gradient(circle at 35% 30%, ${ring}33, #0d1233 70%)`,
          boxShadow: moodCfg.pulse ? `0 0 12px ${ring}` : `0 0 6px ${ring}55`,
        }}
        animate={
          moodCfg.pulse
            ? { boxShadow: [`0 0 6px ${ring}66`, `0 0 18px ${ring}`, `0 0 6px ${ring}66`] }
            : {}
        }
        transition={{ repeat: Infinity, duration: 1.2 }}
      >
        <HfSprite
          frame={avatarFrame(mood)}
          size={size * 1.12}
          className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2"
          label="Pirate"
        />
      </motion.div>
      {moodCfg.badge && (
        <motion.span
          key={mood}
          initial={{ scale: 0, y: 4 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="absolute -right-1.5 -top-1.5 rounded-full bg-black/70 text-xs"
          style={{ padding: 1 }}
        >
          {moodCfg.badge}
        </motion.span>
      )}
    </motion.div>
  );
}
