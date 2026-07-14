import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { TIMING } from "@treasure-trap/shared";
import { useGameStore } from "../store/gameStore";
import { EmojiBurst } from "./fx";
import { sfx } from "../lib/sfx";

/**
 * Per-question personal verdict, straight from the animation spec:
 * CORRECT → coin pop (+N) → streak glow → success burst with stars.
 * WRONG   → casino red flash + Pac-Man style game-over jingle.
 * Also covers mutiny outcomes, marooning, and the first-5 jackpot tease.
 */
export function ResultOverlay() {
  const result = useGameStore((s) => s.lastResult);
  const clear = useGameStore((s) => s.clearResult);

  useEffect(() => {
    if (!result) return;
    if (result.skipped) {
      const t = setTimeout(clear, 1600);
      return () => clearTimeout(t);
    }
    if (result.correct) {
      sfx.correct();
      setTimeout(() => sfx.coins(), 350);
    } else {
      sfx.gameOver();
    }
    const t = setTimeout(clear, TIMING.RESULT_OVERLAY_MS + (result.jackpot ? 500 : 0));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.key]);

  return (
    <AnimatePresence>
      {result && !result.skipped && (
        <motion.div
          key={result.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3"
          role="status"
          aria-label={result.correct ? "Correct answer" : "Wrong answer"}
        >
          {/* Backdrop flash: gold for glory, casino red for shame */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: result.correct
                ? "radial-gradient(circle at 50% 45%, rgba(251,191,36,0.30), rgba(2,6,23,0.88))"
                : "radial-gradient(circle at 50% 45%, rgba(225,29,72,0.35), rgba(2,6,23,0.92))",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {result.correct ? <CorrectSequence result={result} /> : <WrongSequence />}

          {/* Mutiny verdict rider */}
          {result.mutiny && (
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: -4 }}
              transition={{ delay: 1.2, type: "spring", stiffness: 300, damping: 14 }}
              className={`relative rounded-xl border-4 px-5 py-1.5 font-display text-2xl tracking-widest ${
                result.mutiny === "won"
                  ? "border-neon-green bg-emerald-950/70 text-neon-green"
                  : "border-neon-red bg-rose-950/70 text-neon-red"
              }`}
            >
              {result.mutiny === "won" ? "MUTINY PAYS! 🏴" : "MUTINY CRUSHED 💀"}
            </motion.div>
          )}

          {/* Marooned rider */}
          {result.marooned && (
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.4, type: "spring", stiffness: 220 }}
              className="relative rounded-xl border-2 border-amber-300/70 bg-amber-950/70 px-5 py-1.5 text-center font-display text-xl text-amber-200"
            >
              🏝️ MAROONED — skip a question, keep a chest
            </motion.div>
          )}

          {/* First-5 jackpot tease */}
          {result.jackpot && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="relative rounded-full border-2 border-neon-gold bg-amber-400/20 px-5 py-1.5 font-display text-lg text-neon-gold shadow-neon-gold"
            >
              🎰 JACKPOT CHEST INCOMING...
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CorrectSequence({
  result,
}: {
  result: { earned: number; streak: number; streakBonus: number };
}) {
  return (
    <div className="relative flex flex-col items-center gap-2">
      {/* 2. Coin pop */}
      <motion.div
        className="relative flex flex-col items-center"
        initial={{ scale: 0, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 15 }}
      >
        <EmojiBurst emoji="🪙" count={12} distance={130} duration={1.1} />
        <motion.span
          className="text-7xl drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]"
          animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 0.6, delay: 0.2 }}
          aria-hidden
        >
          🪙
        </motion.span>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="font-display text-5xl text-neon-gold title-glow"
        >
          +{result.earned}
        </motion.span>
      </motion.div>

      {/* 3. Streak glow */}
      {result.streak >= 2 && (
        <motion.div
          initial={{ scale: 0, rotate: 8 }}
          animate={{ scale: [0, 1.4, 1], rotate: 0 }}
          transition={{ delay: 0.7, duration: 0.45 }}
          className="relative rounded-2xl border-2 border-neon-cyan bg-cyan-950/70 px-6 py-2 font-display text-3xl text-neon-cyan shadow-neon-cyan"
        >
          <EmojiBurst emoji="🔥" count={6} distance={80} duration={0.9} />
          STREAK ×{result.streak}
          {result.streakBonus > 0 && (
            <span className="ml-2 text-xl text-neon-green">+{result.streakBonus}</span>
          )}
        </motion.div>
      )}

      {/* 4. Success burst */}
      <motion.div
        initial={{ scale: 0, rotate: -8 }}
        animate={{ scale: [0, 1.5, 1], rotate: 0 }}
        transition={{ delay: result.streak >= 2 ? 1.05 : 0.75, duration: 0.5 }}
        className="relative"
      >
        <EmojiBurst emoji="⭐" count={8} distance={110} duration={1} />
        <div className="rounded-2xl border-4 border-neon-green bg-emerald-950/80 px-8 py-3 font-display text-5xl tracking-wider text-neon-green shadow-neon-green">
          CORRECT!
        </div>
        <div className="mt-1 text-center text-2xl tracking-[0.4em]" aria-hidden>
          ⭐⭐⭐
        </div>
      </motion.div>
    </div>
  );
}

function WrongSequence() {
  return (
    <div className="relative flex flex-col items-center gap-3">
      {/* Casino-style bad luck: skull slam + slot lemons */}
      <motion.span
        className="text-7xl"
        initial={{ scale: 3, opacity: 0, rotate: 20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 12 }}
        aria-hidden
      >
        💀
      </motion.span>
      <motion.div
        initial={{ scale: 0, rotate: 6 }}
        animate={{ scale: [0, 1.3, 1], rotate: -3 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="rounded-2xl border-4 border-neon-red bg-rose-950/80 px-8 py-3 font-display text-5xl tracking-wider text-neon-red shadow-neon-pink"
      >
        WRONG!
      </motion.div>
      {/* Slot machine mocks you */}
      <motion.div
        className="flex gap-2 rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-3xl"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        aria-hidden
      >
        {["🍋", "💀", "🍋"].map((e, i) => (
          <motion.span
            key={i}
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 + i * 0.18, type: "spring", stiffness: 300 }}
          >
            {e}
          </motion.span>
        ))}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-sm font-bold text-rose-200/80"
      >
        Streak lost. The house always wins.
      </motion.p>
    </div>
  );
}
