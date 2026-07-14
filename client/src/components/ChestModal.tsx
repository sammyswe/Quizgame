import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { EmojiBurst } from "./fx";
import { ImpactFlash } from "./gamefeel/ImpactFlash";
import { ItemCard } from "./items/ItemCard";
import { RARITY_STYLES } from "../lib/rarityStyles";
import { sfx } from "../lib/sfx";
import { particleCount, useGameFeel } from "../lib/gameFeel";

/**
 * The jackpot chest sequence (6 frames, per the animation spec):
 * 1 CHEST DROPS      — slams onto deck, golden impact + shockwave
 * 2 CHEST RATTLES    — shakes, light leaks out
 * 3 JACKPOT BUILD-UP — rings, sparkles, 777 slot spin, casino chime build
 * 4 EXPLODES OPEN    — burst of riches: coins, gems, confetti
 * 5 ITEM RISES       — hero moment: light beam + item ascends
 * 6 REWARD           — "NEW ITEM UNLOCKED!" card + confirm
 */
type Stage = "drop" | "rattle" | "jackpot" | "burst" | "rise" | "card";

const STAGE_TIMINGS: Array<{ stage: Stage; at: number }> = [
  { stage: "drop", at: 0 },
  { stage: "rattle", at: 800 },
  { stage: "jackpot", at: 1700 },
  { stage: "burst", at: 3300 },
  { stage: "rise", at: 4000 },
  { stage: "card", at: 5300 },
];

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
    sfx.drum();
    const sounds: Array<[number, () => void]> = [
      [800, sfx.chest],
      [1700, sfx.jackpot],
      [3300, sfx.boom],
      [4000, sfx.legendary],
      [5300, reveal.rarity === "legendary" ? sfx.fanfare : sfx.coins],
    ];
    const soundTimers = sounds.map(([at, fn]) => setTimeout(fn, at));
    const timers = STAGE_TIMINGS.slice(1).map(({ stage: s, at }) =>
      setTimeout(() => setStage(s), at),
    );
    const skipTimer = setTimeout(() => setShowSkip(true), 1500);
    return () => {
      [...timers, ...soundTimers, skipTimer].forEach(clearTimeout);
    };
  }, [reveal]);

  if (!reveal) return null;
  const style = RARITY_STYLES[reveal.rarity];
  const closed = stage === "drop" || stage === "rattle" || stage === "jackpot";

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
        {stage === "drop" && <ImpactFlash key="dropflash" color="#fbbf24" opacity={0.2} />}
        {stage === "burst" && <ImpactFlash key="burstflash" color={style.frame} opacity={0.55} />}

        {reveal.jackpot && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-10 rounded-full border-2 border-neon-gold bg-amber-400/15 px-6 py-1.5 font-display text-xl tracking-widest text-neon-gold shadow-neon-gold"
          >
            🎰 FIRST-5 JACKPOT!
          </motion.div>
        )}

        <div className="relative flex w-full max-w-sm flex-col items-center gap-5 text-center">
          {/* ---- Frames 1-3: the closed chest ---- */}
          {closed && (
            <div className="relative flex h-64 flex-col items-center justify-center">
              {/* 1: slam down with shockwave */}
              {stage === "drop" && (
                <motion.div
                  className="absolute bottom-6 h-3 w-48 rounded-full bg-amber-300/40 blur-sm"
                  initial={{ scaleX: 0.2, opacity: 0 }}
                  animate={{ scaleX: [0.2, 1.6, 1], opacity: [0, 1, 0] }}
                  transition={{ duration: 0.7, delay: 0.25 }}
                  aria-hidden
                />
              )}
              <div
                className={
                  stage === "drop"
                    ? "animate-chest-slam"
                    : stage === "jackpot"
                      ? "animate-chest-shake-hard"
                      : "animate-chestShake"
                }
              >
                <span className="text-9xl drop-shadow-[0_0_30px_rgba(251,191,36,0.6)]" aria-hidden>
                  🎁
                </span>
              </div>

              {/* 2: light leaks out of the seams */}
              {(stage === "rattle" || stage === "jackpot") && (
                <motion.div
                  className="absolute inset-0 -z-10 rounded-full blur-2xl"
                  style={{ backgroundColor: `${style.frame}55` }}
                  animate={{ scale: [1, 1.5, 1.2, 1.9], opacity: [0.3, 0.8, 0.5, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                  aria-hidden
                />
              )}

              {/* 3: jackpot build-up — golden rings + 777 slot */}
              {stage === "jackpot" && (
                <>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full border-2 border-amber-300/80"
                      style={{ width: 80, height: 80 }}
                      initial={{ scale: 0.6, opacity: 0.9, rotate: 0 }}
                      animate={{ scale: 3.2 + i, opacity: 0, rotate: 120 }}
                      transition={{ duration: 1.1, delay: i * 0.25, repeat: Infinity }}
                      aria-hidden
                    />
                  ))}
                  <EmojiBurst emoji="✨" count={particleCount(8, intensity)} distance={120} duration={1.4} />
                  <motion.div
                    className="absolute -bottom-2 flex gap-1 rounded-xl border-2 border-amber-300 bg-black/80 px-4 py-1.5 font-display text-3xl text-neon-gold shadow-neon-gold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    aria-hidden
                  >
                    {[0, 1, 2].map((i) => (
                      <SlotDigit key={i} delay={i * 0.3} />
                    ))}
                  </motion.div>
                </>
              )}
            </div>
          )}

          {/* ---- Frame 4: explodes open ---- */}
          {stage === "burst" && (
            <div className="relative flex h-64 items-center justify-center">
              <motion.span
                className="text-9xl"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.5, 0.9], rotate: [0, -8, 5] }}
                transition={{ duration: 0.5 }}
                aria-hidden
              >
                🧨
              </motion.span>
              <EmojiBurst emoji="🪙" count={particleCount(18, intensity)} distance={170} duration={1.1} />
              <EmojiBurst emoji="💎" count={particleCount(8, intensity)} distance={130} duration={1} />
              <EmojiBurst emoji={style.burst} count={particleCount(10, intensity)} distance={120} duration={1} />
            </div>
          )}

          {/* ---- Frame 5: the item RISES on a beam of light ---- */}
          {stage === "rise" && (
            <div className="relative flex h-64 items-center justify-center overflow-visible">
              {/* light beam */}
              <motion.div
                className="absolute bottom-0 h-full w-24"
                style={{
                  background: `linear-gradient(to top, ${style.frame}66, transparent)`,
                }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ duration: 0.4 }}
                aria-hidden
              />
              <motion.span
                className="relative text-8xl"
                initial={{ y: 90, scale: 0.5, opacity: 0 }}
                animate={{ y: -10, scale: 1.2, opacity: 1, rotate: [0, -6, 6, 0] }}
                transition={{ duration: 1, type: "spring", stiffness: 120, damping: 12 }}
                style={{ filter: `drop-shadow(0 0 30px ${style.frame})` }}
                aria-hidden
              >
                {reveal.powerUpDef.icon}
              </motion.span>
              <EmojiBurst emoji="✨" count={particleCount(10, intensity)} distance={110} duration={1.2} />
            </div>
          )}

          {/* ---- Frame 6: reward resolution ---- */}
          {stage === "card" && (
            <motion.div
              initial={{ y: 120, scale: 0.4, opacity: 0, rotate: -8 }}
              animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 15 }}
              className="relative flex w-full flex-col items-center gap-4"
            >
              <EmojiBurst emoji={style.burst} count={particleCount(8, intensity)} distance={130} duration={1} />
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                className="rounded-full px-6 py-1.5 font-display text-lg uppercase tracking-[0.25em] text-black"
                style={{ background: style.banner, boxShadow: style.glow }}
              >
                New item unlocked!
              </motion.div>
              <div className="w-full">
                <ItemCard def={reveal.powerUpDef} />
              </div>
              <motion.button whileTap={{ scale: 0.94 }} className="btn-gold w-full" onClick={clear}>
                Keep it 💰
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

/** One reel of the 777 slot — spins digits then settles on 7. */
function SlotDigit({ delay }: { delay: number }) {
  const [digit, setDigit] = useState(0);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setDigit(Math.floor(Math.random() * 10));
      if (i > 8 + delay * 10) {
        clearInterval(iv);
        setDigit(7);
        setSettled(true);
      }
    }, 80);
    return () => clearInterval(iv);
  }, [delay]);

  return (
    <motion.span
      animate={settled ? { scale: [1, 1.4, 1], color: "#fbbf24" } : { color: "#94a3b8" }}
      transition={{ duration: 0.3 }}
      className="w-7 tabular-nums"
    >
      {digit}
    </motion.span>
  );
}
