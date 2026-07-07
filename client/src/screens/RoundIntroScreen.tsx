import { motion } from "framer-motion";
import { ROUNDS } from "@treasure-trap/shared";
import { useGameStore } from "../store/gameStore";
import { Screen, TimerBar } from "../components/ui";

export function RoundIntroScreen() {
  const game = useGameStore((s) => s.game);
  if (!game?.currentRound) return null;
  const meta = ROUNDS[game.currentRound];

  return (
    <Screen className="items-center justify-center gap-6 text-center">
      <motion.div
        initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">
          Round {game.roundIndex + 1} of {game.roundPlan.length}
        </div>
        <div className="text-8xl animate-floaty" aria-hidden>
          {meta.icon}
        </div>
        <h1 className="font-display text-5xl text-neon-gold title-glow">{meta.name}</h1>
        <p className="max-w-xs text-base font-bold text-neon-cyan">{meta.tagline}</p>
      </motion.div>

      <motion.ul
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.35, delayChildren: 0.5 } } }}
        className="flex w-full max-w-xs flex-col gap-2 text-left"
      >
        {meta.howTo.map((line, i) => (
          <motion.li
            key={i}
            variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}
            className="neon-card flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-bold"
          >
            <span className="font-display text-neon-gold">{i + 1}</span>
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
