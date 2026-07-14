import { motion } from "framer-motion";
import type { Rarity } from "@treasure-trap/shared";
import { RARITY_STYLES } from "../../lib/rarityStyles";

export type CardDef = {
  name: string;
  icon: string;
  rarity: Rarity;
  description: string;
  /** True for attack power-ups — the Fire button arms targeting mode. */
  isAttack?: boolean;
};

/**
 * Mobile-game power-up card: rarity frame + glow, chunky icon, name,
 * one-line effect. Used in the booty bag and chest reveals.
 */
export function ItemCard({
  def,
  compact = false,
  onPlay,
  playDisabled,
}: {
  def: CardDef;
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
          className={`flex shrink-0 items-center justify-center rounded-full border-2 font-display ${
            compact ? "h-11 w-11 text-lg" : "h-14 w-14 text-xl"
          }`}
          style={{ borderColor: style.frame, color: style.text, background: "#102b3d" }}
          animate={{ y: [0, -3, 0], rotate: [0, def.rarity === "legendary" ? 6 : 3, 0] }}
          transition={{ repeat: Infinity, duration: 2.4 }}
          aria-hidden
        >
          {def.name.slice(0, 2).toUpperCase()}
        </motion.span>
        <div className="min-w-0 flex-1 pr-10">
          <div className="font-display text-base leading-tight" style={{ color: style.text }}>
            {def.name}
          </div>
          <p className={`text-slate-300 ${compact ? "text-[11px]" : "text-xs"}`}>
            {def.description}
          </p>
        </div>
        {onPlay && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            disabled={playDisabled}
            onClick={onPlay}
            className={`!min-h-0 shrink-0 !px-3.5 !py-2 !text-sm ${def.isAttack ? "btn-pink" : "btn-cyan"} ${playDisabled ? "opacity-40" : ""}`}
          >
            {def.isAttack ? "Aim" : "Use"}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
