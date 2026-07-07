import { motion } from "framer-motion";
import type { ItemDef } from "@treasure-trap/shared";
import { CannonBlast } from "../effects/CannonBlast";
import { EmojiBurst } from "../fx";
import { RARITY_STYLES } from "../../lib/rarityStyles";

type UseVariant = "projectile" | "aura" | "swap" | "sneak";

const VARIANTS: Record<string, UseVariant> = {
  copycat: "sneak",
  spyglass: "aura",
  luckyDoubloon: "aura",
  fearShot: "projectile",
  rumRush: "aura",
  sabotage: "projectile",
  sneaksMap: "sneak",
  treasureSwitch: "swap",
  backstab: "projectile",
  doubleAgent: "sneak",
  shipwreck: "projectile",
  crownHeist: "projectile",
  broadsideDuel: "projectile",
  blackSpot: "projectile",
  captainsCurse: "aura",
};

/**
 * Full-screen flourish when YOU play an item: attacks launch as projectiles
 * with a cannon impact, buffs bloom as auras, swaps whirl, sneaky items slide
 * in from the shadows. Self-dismissing; mount with a key.
 */
export function ItemUseOverlay({ def }: { def: ItemDef }) {
  const style = RARITY_STYLES[def.rarity];
  const variant = VARIANTS[def.id] ?? "aura";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center"
      aria-hidden
    >
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.5, times: [0, 0.15, 0.8, 1] }}
      />

      {variant === "projectile" && (
        <>
          <motion.div
            className="absolute text-6xl"
            initial={{ y: "38vh", x: "-20vw", scale: 0.6, rotate: -30 }}
            animate={{ y: "-18vh", x: "12vw", scale: 1.3, rotate: 20 }}
            transition={{ duration: 0.55, ease: "easeIn" }}
          >
            {def.icon}
          </motion.div>
          <motion.div
            className="absolute"
            style={{ top: "26%", right: "28%" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            <CannonBlast small />
          </motion.div>
        </>
      )}

      {variant === "aura" && (
        <div className="relative flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2"
              style={{ borderColor: style.frame, width: 60, height: 60 }}
              initial={{ scale: 0.6, opacity: 0.9 }}
              animate={{ scale: 3 + i, opacity: 0 }}
              transition={{ duration: 1, delay: i * 0.18, ease: "easeOut" }}
            />
          ))}
          <motion.span
            className="text-7xl"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: [0, 1.4, 1.15], rotate: 0 }}
            transition={{ duration: 0.5 }}
          >
            {def.icon}
          </motion.span>
          <EmojiBurst emoji={style.burst} count={8} distance={100} duration={0.9} />
        </div>
      )}

      {variant === "swap" && (
        <div className="relative h-40 w-56">
          <motion.span
            className="absolute left-0 top-1/2 text-5xl"
            animate={{ x: [0, 160, 0], y: [0, -50, 0], rotate: 360 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          >
            💰
          </motion.span>
          <motion.span
            className="absolute right-0 top-1/2 text-5xl"
            animate={{ x: [0, -160, 0], y: [0, 50, 0], rotate: -360 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          >
            💰
          </motion.span>
          <EmojiBurst emoji="🔁" count={5} distance={70} duration={1} />
        </div>
      )}

      {variant === "sneak" && (
        <motion.div
          className="relative flex flex-col items-center"
          initial={{ x: "-40vw", opacity: 0, rotate: -8 }}
          animate={{ x: 0, opacity: [0, 1, 1, 0.8], rotate: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span className="text-7xl drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]">{def.icon}</span>
          <motion.span
            className="mt-2 font-display text-lg"
            style={{ color: style.text }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            shhh...
          </motion.span>
        </motion.div>
      )}

      <motion.div
        className="absolute bottom-24 font-display text-2xl"
        style={{ color: style.text }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.5, times: [0, 0.2, 0.8, 1] }}
      >
        {def.name}!
      </motion.div>
    </div>
  );
}
