import { motion } from "framer-motion";
import type { ItemDef } from "@treasure-trap/shared";
import { RARITY_STYLES } from "../../lib/rarityStyles";

const TIMING_LABELS: Record<string, string> = {
  prep: "⏳ before the question",
  question: "❓ during the question",
  lock: "🔒 at answer lock",
  reveal: "🎭 at the reveal",
  final: "🏴‍☠️ late game",
};

/**
 * Mobile-game power-up card: rarity frame + glow, chunky icon, name,
 * one-line effect, timing chip. Used in the booty bag and chest reveals.
 */
export function ItemCard({
  def,
  compact = false,
  onPlay,
  playDisabled,
}: {
  def: ItemDef;
  compact?: boolean;
  onPlay?: () => void;
  playDisabled?: boolean;
}) {
  const style = RARITY_STYLES[def.rarity];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.02, rotate: -0.4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative overflow-hidden rounded-2xl border-2 ${style.extraClass ?? ""}`}
      style={{ borderColor: style.frame, background: style.face, boxShadow: style.glow }}
    >
      {/* Rarity corner ribbon */}
      <div
        className="absolute right-0 top-0 rounded-bl-xl px-2 py-0.5 font-display text-[10px] uppercase tracking-widest text-black"
        style={{ background: style.banner }}
      >
        {style.label}
      </div>

      <div className={`flex items-center gap-3 ${compact ? "p-2.5" : "p-3.5"}`}>
        <motion.span
          className={compact ? "text-3xl" : "text-4xl"}
          animate={{ y: [0, -3, 0], rotate: [0, def.rarity === "legendary" ? 6 : 3, 0] }}
          transition={{ repeat: Infinity, duration: 2.4 }}
          aria-hidden
        >
          {def.icon}
        </motion.span>
        <div className="min-w-0 flex-1 pr-10">
          <div className="font-display text-base leading-tight" style={{ color: style.text }}>
            {def.name}
          </div>
          <p className={`text-slate-300 ${compact ? "text-[11px]" : "text-xs"}`}>
            {def.description}
          </p>
          <div className="mt-1 inline-block rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold text-slate-400">
            {TIMING_LABELS[def.timing] ?? def.timing}
          </div>
        </div>
        {onPlay && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            disabled={playDisabled}
            onClick={onPlay}
            className="btn-cyan !min-h-0 shrink-0 !px-3.5 !py-2 !text-sm"
          >
            Fire!
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
