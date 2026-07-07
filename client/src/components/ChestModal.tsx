import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { RARITY_META } from "@treasure-trap/shared";
import { useGameStore } from "../store/gameStore";
import { EmojiBurst } from "./fx";
import { sfx } from "../lib/sfx";

/**
 * Chest opening: shake → rarity wheel spin → glow → item pop → explanation.
 * Sequenced with timed stages so the drama lands even on slow taps.
 */
export function ChestModal() {
  const reveal = useGameStore((s) => s.chestReveal);
  const clear = useGameStore((s) => s.clearChestReveal);
  const [stage, setStage] = useState<"shake" | "spin" | "pop">("shake");

  useEffect(() => {
    if (!reveal) return;
    setStage("shake");
    sfx.chest();
    const t1 = setTimeout(() => setStage("spin"), 900);
    const t2 = setTimeout(() => {
      setStage("pop");
      if (reveal.rarity === "legendary" || reveal.rarity === "epic") {
        sfx.legendary();
      } else {
        sfx.coins();
      }
    }, 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reveal]);

  if (!reveal) return null;
  const meta = RARITY_META[reveal.rarity];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
        role="dialog"
        aria-label="Chest opening"
      >
        <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
          {stage === "shake" && (
            <motion.div className="animate-chestShake text-8xl" aria-hidden>
              🎁
            </motion.div>
          )}

          {stage === "spin" && (
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                className="text-7xl"
                aria-hidden
              >
                🛞
              </motion.div>
              <RarityWheel finalColor={meta.color} finalLabel={meta.label} />
            </div>
          )}

          {stage === "pop" && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="relative flex w-full flex-col items-center gap-3 rounded-3xl border p-6"
              style={{
                borderColor: meta.color,
                boxShadow: `0 0 24px ${meta.glow}88, 0 0 80px ${meta.glow}44`,
                background: "rgba(13,18,51,0.95)",
              }}
            >
              <EmojiBurst
                emoji={reveal.rarity === "legendary" ? "⭐" : "✨"}
                count={12}
                distance={130}
                duration={1}
              />
              <div
                className="font-display text-sm uppercase tracking-[0.3em]"
                style={{ color: meta.color }}
              >
                {meta.label}
              </div>
              <motion.div
                initial={{ y: 12 }}
                animate={{ y: [12, -6, 0] }}
                transition={{ duration: 0.5 }}
                className="text-7xl"
                aria-hidden
              >
                {reveal.itemDef.icon}
              </motion.div>
              <div className="font-display text-2xl text-neon-gold text-outline">
                {reveal.itemDef.name}
              </div>
              <p className="text-sm text-slate-300">{reveal.itemDef.description}</p>
              <p className="text-xs italic text-slate-500">Counter: {reveal.itemDef.counterplay}</p>
              <button className="btn-gold mt-2 w-full" onClick={clear}>
                Stash it! 💰
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function RarityWheel({ finalColor, finalLabel }: { finalColor: string; finalLabel: string }) {
  const labels = ["Common", "Rare", "Epic", "Legendary"];
  const [idx, setIdx] = useState(0);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    let i = 0;
    const spin = setInterval(() => {
      i += 1;
      setIdx(i % labels.length);
    }, 120);
    const stop = setTimeout(() => {
      clearInterval(spin);
      setSettled(true);
    }, 1100);
    return () => {
      clearInterval(spin);
      clearTimeout(stop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      className="rounded-full border px-6 py-2 font-display text-xl transition-colors"
      style={
        settled
          ? { color: finalColor, borderColor: finalColor, boxShadow: `0 0 18px ${finalColor}` }
          : { color: "#94a3b8", borderColor: "#334155" }
      }
    >
      {settled ? finalLabel : labels[idx]}
    </div>
  );
}
