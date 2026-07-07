import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { EmojiBurst } from "./fx";
import { ImpactFlash } from "./gamefeel/ImpactFlash";
import { ItemCard } from "./items/ItemCard";
import { RARITY_STYLES } from "../lib/rarityStyles";
import { playSound } from "../lib/soundEvents";
import { particleCount, useGameFeel } from "../lib/gameFeel";

type Stage = "drop" | "chains" | "shake" | "spin" | "burst" | "card";

const STAGE_TIMINGS: Array<{ stage: Stage; at: number }> = [
  { stage: "drop", at: 0 },
  { stage: "chains", at: 750 },
  { stage: "shake", at: 1500 },
  { stage: "spin", at: 2400 },
  { stage: "burst", at: 3700 },
  { stage: "card", at: 4300 },
];

/**
 * The loot-box moment: chest slams down → chains snap → escalating shake →
 * rarity slot spin → burst open with coins → item card flies out with a
 * rarity banner. Skippable after a moment, but built to be watched.
 */
export function ChestModal() {
  const reveal = useGameStore((s) => s.chestReveal);
  const clear = useGameStore((s) => s.clearChestReveal);
  const intensity = useGameFeel((s) => s.intensity);
  const [stage, setStage] = useState<Stage>("drop");
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    if (!reveal) return;
    setStage("drop");
    setShowSkip(false);
    playSound("chestOpen");
    const timers = STAGE_TIMINGS.slice(1).map(({ stage: s, at }) =>
      setTimeout(() => {
        setStage(s);
        if (s === "burst") {
          playSound(
            reveal.rarity === "legendary" || reveal.rarity === "epic" ? "itemReveal" : "coinGain",
          );
        }
      }, at),
    );
    const skipTimer = setTimeout(() => setShowSkip(true), 1200);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(skipTimer);
    };
  }, [reveal]);

  if (!reveal) return null;
  const style = RARITY_STYLES[reveal.rarity];
  const preOpen = stage === "drop" || stage === "chains" || stage === "shake" || stage === "spin";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
        role="dialog"
        aria-label="Chest opening"
      >
        {stage === "drop" && <ImpactFlash key="dropflash" color="#fbbf24" opacity={0.15} />}
        {stage === "burst" && <ImpactFlash key="burstflash" color={style.frame} opacity={0.5} />}

        <div className="relative flex w-full max-w-sm flex-col items-center gap-5 text-center">
          {/* ---- Chest (pre-open stages) ---- */}
          {preOpen && (
            <div className="relative flex h-64 flex-col items-center justify-center">
              <div
                className={
                  stage === "drop"
                    ? "animate-chest-slam"
                    : stage === "shake" || stage === "spin"
                      ? "animate-chest-shake-hard"
                      : "animate-chestShake"
                }
              >
                <span className="text-9xl drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]" aria-hidden>
                  🎁
                </span>
              </div>

              {/* Chains snapping off */}
              {stage === "chains" && (
                <>
                  {[
                    { x: -90, y: -40, r: -80 },
                    { x: 80, y: -60, r: 60 },
                    { x: -60, y: 60, r: 45 },
                    { x: 95, y: 40, r: -50 },
                  ].map((c, i) => (
                    <motion.span
                      key={i}
                      className="absolute text-3xl"
                      initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                      animate={{ x: c.x, y: c.y, rotate: c.r, opacity: 0 }}
                      transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                      aria-hidden
                    >
                      ⛓️
                    </motion.span>
                  ))}
                </>
              )}

              {/* Escalating glow */}
              {(stage === "shake" || stage === "spin") && (
                <motion.div
                  className="absolute inset-0 -z-10 rounded-full blur-2xl"
                  style={{ backgroundColor: `${style.frame}44` }}
                  animate={{ scale: [1, 1.5, 1.2, 1.8], opacity: [0.3, 0.7, 0.5, 0.9] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  aria-hidden
                />
              )}

              {/* Rarity slot-machine spin */}
              {stage === "spin" && <RaritySlot finalRarity={reveal.rarity} />}
            </div>
          )}

          {/* ---- Burst ---- */}
          {stage === "burst" && (
            <div className="relative flex h-64 items-center justify-center">
              <motion.span
                className="text-9xl"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.4, 0.9], rotate: [0, -6, 4] }}
                transition={{ duration: 0.5 }}
                aria-hidden
              >
                🧨
              </motion.span>
              <EmojiBurst
                emoji="🪙"
                count={particleCount(16, intensity)}
                distance={160}
                duration={1.1}
              />
              <EmojiBurst
                emoji={style.burst}
                count={particleCount(10, intensity)}
                distance={120}
                duration={1}
              />
            </div>
          )}

          {/* ---- Item card flies out ---- */}
          {stage === "card" && (
            <motion.div
              initial={{ y: 120, scale: 0.4, opacity: 0, rotate: -8 }}
              animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 15 }}
              className="relative flex w-full flex-col items-center gap-4"
            >
              <EmojiBurst
                emoji={style.burst}
                count={particleCount(8, intensity)}
                distance={130}
                duration={1}
              />
              {/* Rarity banner */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="rounded-full px-6 py-1.5 font-display text-lg uppercase tracking-[0.3em] text-black"
                style={{ background: style.banner, boxShadow: style.glow }}
              >
                {style.label}!
              </motion.div>
              <div className="w-full">
                <ItemCard def={reveal.itemDef} />
              </div>
              <p className="text-xs italic text-slate-500">Counter: {reveal.itemDef.counterplay}</p>
              <motion.button whileTap={{ scale: 0.94 }} className="btn-gold w-full" onClick={clear}>
                Stash it! 💰
              </motion.button>
            </motion.div>
          )}

          {/* Skip */}
          {showSkip && stage !== "card" && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              className="absolute -bottom-10 text-xs text-slate-400 underline underline-offset-2"
              onClick={() => setStage("card")}
            >
              Skip ⏭️
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Slot-machine rarity spinner that settles on the real rarity. */
function RaritySlot({ finalRarity }: { finalRarity: keyof typeof RARITY_STYLES }) {
  const order = ["common", "rare", "epic", "legendary"] as const;
  const [idx, setIdx] = useState(0);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let i = 0;
    let speed = 90;
    let timer: ReturnType<typeof setTimeout>;
    const spin = () => {
      i += 1;
      setIdx(i % order.length);
      speed *= 1.13; // slows down like a real slot wheel
      if (speed < 300) {
        timer = setTimeout(spin, speed);
      } else {
        setSettled(true);
      }
    };
    timer = setTimeout(spin, speed);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showing = settled ? finalRarity : (order[idx] ?? "common");
  const style = RARITY_STYLES[showing];
  return (
    <motion.div
      className="absolute -bottom-2 rounded-full border-2 px-6 py-1.5 font-display text-xl"
      style={{
        color: style.text,
        borderColor: style.frame,
        boxShadow: settled ? style.glow : undefined,
        background: "rgba(0,0,0,0.6)",
      }}
      animate={settled ? { scale: [1, 1.3, 1] } : {}}
      transition={{ duration: 0.35 }}
    >
      {style.label}
    </motion.div>
  );
}
