import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TIMING, type RevealEvent } from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { Confetti, Screen } from "../components/ui";

const TYPE_STYLES: Record<string, string> = {
  correctAnswer: "border-neon-green/70 shadow-neon-green",
  lootPlundered: "border-neon-red/70 shadow-neon-pink",
  itemTriggered: "border-neon-purple/70 shadow-neon-purple",
  itemBlocked: "border-neon-cyan/70 shadow-neon-cyan",
  missionSuccess: "border-neon-purple/70 shadow-neon-purple",
  missionFailed: "border-white/20",
  accusationCorrect: "border-neon-red/70 shadow-neon-pink",
  accusationWrong: "border-white/30",
  scoreChanged: "border-neon-gold/70 shadow-neon-gold",
  chestEarned: "border-neon-gold/70 shadow-neon-gold",
  auctionResult: "border-neon-gold/70 shadow-neon-gold",
  pairResult: "border-neon-pink/70 shadow-neon-pink",
  chaseMove: "border-neon-cyan/70 shadow-neon-cyan",
  finalAction: "border-neon-red/70 shadow-neon-pink",
  leaderboardChanged: "border-neon-cyan/70 shadow-neon-cyan",
};

/**
 * The reveal queue: every score change plays out one event at a time.
 * Nothing changes silently — this screen IS the game's storytelling.
 */
export function RevealScreen() {
  const game = useGameStore((s) => s.game);
  const isHost = useGameStore((s) => s.isHost());
  const events = useMemo(() => game?.revealEvents ?? [], [game?.revealEvents]);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    if (events.length === 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= events.length; i++) {
      timers.push(
        setTimeout(() => setShown(i), i === 1 ? 400 : 400 + (i - 1) * TIMING.REVEAL_STEP_MS),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [events]);

  if (!game) return null;
  const current: RevealEvent | undefined = shown > 0 ? events[shown - 1] : undefined;
  const history = events
    .slice(0, Math.max(0, shown - 1))
    .slice(-4)
    .reverse();
  const bigWin =
    current &&
    (current.type === "missionSuccess" ||
      current.type === "accusationCorrect" ||
      (current.pointsDelta && Math.max(...Object.values(current.pointsDelta)) >= 150));

  return (
    <Screen className="items-center gap-4">
      {bigWin && <Confetti count={30} />}
      <h1 className="pt-2 font-display text-3xl text-neon-gold title-glow">The Reveal 🔥</h1>
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
        <AnimatePresence mode="wait">
          {current ? (
            <motion.div
              key={current.id}
              initial={{ scale: 0.6, opacity: 0, rotate: -3 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 240, damping: 18 }}
              className={`neon-card w-full max-w-sm border-2 p-6 text-center ${TYPE_STYLES[current.type] ?? "border-white/20"}`}
              role="status"
            >
              {current.icon && (
                <motion.div
                  className="text-6xl"
                  initial={{ y: -12 }}
                  animate={{ y: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  aria-hidden
                >
                  {current.icon}
                </motion.div>
              )}
              <h2 className="mt-2 font-display text-2xl text-outline">{current.title}</h2>
              <p className="mt-1.5 text-sm text-slate-200">{current.description}</p>
              {current.pointsDelta && <DeltaRow delta={current.pointsDelta} />}
            </motion.div>
          ) : (
            <motion.div
              key="drumroll"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="animate-shimmer font-display text-2xl text-neon-cyan"
            >
              🥁 Drumroll...
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex w-full max-w-sm flex-col gap-1.5" aria-label="Previous reveals">
          {history.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 text-xs text-slate-400"
            >
              <span aria-hidden>{e.icon}</span>
              <span className="truncate">{e.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-sm items-center justify-between text-xs text-slate-500">
        <span>
          {Math.min(shown, events.length)}/{events.length} revealed
        </span>
        {isHost && (
          <button
            className="btn-ghost !min-h-0 !px-3 !py-1.5 !text-xs"
            onClick={() => socket.emit("phase:advance")}
          >
            Skip ahead ⏭️
          </button>
        )}
      </div>
    </Screen>
  );
}

function DeltaRow({ delta }: { delta: Record<string, number> }) {
  const game = useGameStore((s) => s.game);
  if (!game) return null;
  const entries = Object.entries(delta).filter(([, d]) => d !== 0);
  if (entries.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
      {entries.map(([id, d]) => {
        const p = game.players.find((x) => x.id === id);
        if (!p) return null;
        return (
          <motion.span
            key={id}
            initial={{ scale: 0, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, delay: 0.25 }}
            className={`rounded-full px-2.5 py-1 text-sm font-black ${
              d > 0 ? "bg-neon-green/15 text-neon-green" : "bg-neon-red/15 text-neon-red"
            }`}
          >
            {p.avatar} {p.nickname} {d > 0 ? "+" : ""}
            {d}
          </motion.span>
        );
      })}
    </div>
  );
}
