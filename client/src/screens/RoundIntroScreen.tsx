import { motion } from "framer-motion";
import { useEffect } from "react";
import { ARCADE, SPECIAL_EVENTS } from "@treasure-trap/shared";
import { useGameStore } from "../store/gameStore";
import { Screen, TimerBar } from "../components/ui";
import { EmojiBurst } from "../components/fx";
import { sfx } from "../lib/sfx";

/**
 * Intro splash: shown once at the voyage start and before every special event.
 */
export function RoundIntroScreen() {
  const game = useGameStore((s) => s.game);

  useEffect(() => {
    sfx.drum();
    const t = setTimeout(() => sfx.sting(), 350);
    return () => clearTimeout(t);
  }, [game?.arcade?.roundNumber]);

  if (!game?.arcade) return null;
  const arcade = game.arcade;
  const isEvent = arcade.isEventRound;
  const meta = isEvent ? SPECIAL_EVENTS[arcade.eventId ?? "millionPoundDrop"] : undefined;

  const icon = meta?.icon ?? "🏴‍☠️";
  const title = meta?.name ?? "Anchors away!";
  const tagline = meta?.tagline ?? "Answer fast. Gold drains. Trust no one.";
  const howTo = meta?.howTo ?? [
    "Answer fast — the pot drains from 100 to 30",
    `1 right in the first ${ARCADE.FIRST_ITEM_WINDOW} rounds = 🎁 item`,
    "Streaks pay extra. Mutiny is always on the table.",
  ];

  return (
    <Screen className="items-center justify-center gap-6 text-center">
      <motion.div
        initial={{ scale: 3, opacity: 0, rotate: -12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="relative flex flex-col items-center gap-3"
      >
        <EmojiBurst emoji={icon} count={8} distance={130} duration={1.1} />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xs font-black uppercase tracking-[0.35em] text-slate-400"
        >
          {isEvent ? `⚡ Special Event · Round ${arcade.roundNumber}` : `Round 1 of ${arcade.totalRounds}`}
        </motion.div>
        <div
          className="animate-hero-bob text-8xl drop-shadow-[0_0_24px_rgba(251,191,36,0.5)]"
          aria-hidden
        >
          {icon}
        </div>
        <h1 className="font-display text-5xl text-neon-gold title-glow">{title}</h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-xs text-base font-bold text-neon-cyan"
        >
          {tagline}
        </motion.p>
      </motion.div>

      <motion.ul
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.3, delayChildren: 0.6 } } }}
        className="flex w-full max-w-xs flex-col gap-2 text-left"
      >
        {howTo.map((line, i) => (
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
