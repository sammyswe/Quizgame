import { motion } from "framer-motion";
import { useEffect } from "react";
import { ROUNDS } from "@treasure-trap/shared";
import { useGameStore } from "../store/gameStore";
import { Screen, TimerBar } from "../components/ui";
import { EmojiBurst } from "../components/fx";
import { sfx } from "../lib/sfx";

export function RoundIntroScreen() {
  const game = useGameStore((s) => s.game);

  useEffect(() => {
    sfx.drum();
    const t = setTimeout(() => sfx.sting(), 350);
    return () => clearTimeout(t);
  }, [game?.roundIndex]);

  if (!game?.currentRound) return null;
  const meta = ROUNDS[game.currentRound];

  return (
    <Screen className="items-center justify-center gap-6 text-center">
      <motion.div
        initial={{ scale: 3, opacity: 0, rotate: -12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="relative flex flex-col items-center gap-3"
      >
        <EmojiBurst emoji={meta.icon} count={8} distance={130} duration={1.1} />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xs font-black uppercase tracking-[0.35em] text-slate-400"
        >
          Round {game.roundIndex + 1} of {game.roundPlan.length}
        </motion.div>
        <div
          className="animate-hero-bob text-8xl drop-shadow-[0_0_24px_rgba(251,191,36,0.5)]"
          aria-hidden
        >
          {meta.icon}
        </div>
        <h1 className="font-display text-5xl text-neon-gold title-glow">{meta.name}</h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-xs text-base font-bold text-neon-cyan"
        >
          {meta.tagline}
        </motion.p>
      </motion.div>

      <motion.ul
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.35, delayChildren: 0.6 } } }}
        className="flex w-full max-w-xs flex-col gap-2 text-left"
      >
        {meta.howTo.map((line, i) => (
          <motion.li
            key={i}
            variants={{
              hidden: { opacity: 0, x: -40, rotate: -1.5 },
              show: {
                opacity: 1,
                x: 0,
                rotate: 0,
                transition: { type: "spring", stiffness: 260, damping: 20 },
              },
            }}
            className="neon-card flex items-center gap-2.5 border-2 border-white/10 px-3.5 py-2.5 text-sm font-bold"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neon-gold/50 font-display text-neon-gold">
              {i + 1}
            </span>
            {line}
          </motion.li>
        ))}
      </motion.ul>

      <div className="w-full max-w-xs">
        <TimerBar endsAt={game.timerEndsAt} />
      </div>
    </Screen>
  );
}
