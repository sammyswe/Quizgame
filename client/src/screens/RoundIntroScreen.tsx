import { motion } from "framer-motion";
import { useEffect } from "react";
import { ARCADE, SPECIAL_EVENTS } from "@treasure-trap/shared";
import { useGameStore } from "../store/gameStore";
import { Screen, TimerBar } from "../components/ui";
import { sfx } from "../lib/sfx";
import { socket } from "../net/socket";

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

  const title = meta?.name ?? "THE SEVEN SEAS";
  const tagline = meta?.tagline ?? "The fleet enters its first sunlit archipelago.";
  const howTo = meta?.howTo ?? [
    "Answer fast — the pot drains from 100 to 30",
    `Your first item arrives after question ${ARCADE.FIRST_ITEM_WINDOW}`,
    "Choose an island, confirm your course, then watch the fleet sail.",
  ];

  return (
    <Screen className="items-center justify-center gap-6 text-center">
      <motion.div
        initial={{ scale: 3, opacity: 0, rotate: -12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="pirate-panel relative flex w-full max-w-4xl flex-col items-center gap-3 px-10 py-9"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xs font-black uppercase tracking-[0.35em] text-slate-400"
        >
          {isEvent ? `Special voyage after question ${arcade.roundNumber}` : `Question 1 of ${arcade.totalRounds}`}
        </motion.div>
        <div className="my-2 h-2 w-52 rounded-full bg-gradient-to-r from-transparent via-[#f2c85b] to-transparent" />
        <h1 className="font-display text-6xl text-[#ffe18a] title-glow">{title}</h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl text-lg font-bold text-[#d7eff7]"
        >
          {tagline}
        </motion.p>
      </motion.div>

      <motion.ul
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.3, delayChildren: 0.6 } } }}
        className="flex w-full max-w-2xl flex-col gap-2 text-left"
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
            className="pirate-panel flex items-center gap-2.5 px-4 py-3 text-sm font-bold"
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
      <button className="btn-gold min-w-64" onClick={() => socket.emit("phase:advance")}>
        ENTER THE VOYAGE
      </button>
    </Screen>
  );
}
