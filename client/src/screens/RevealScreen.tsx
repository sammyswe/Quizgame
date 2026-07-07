import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TIMING, type RevealEvent } from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { Confetti, Screen } from "../components/ui";
import { EmojiBurst, Shaker } from "../components/fx";
import { sfx } from "../lib/sfx";

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

/** Which sound + FX each reveal type deserves. */
function eventFeel(e: RevealEvent): { sound: () => void; shake: boolean; burst?: string } {
  const maxDelta = e.pointsDelta ? Math.max(...Object.values(e.pointsDelta)) : 0;
  const minDelta = e.pointsDelta ? Math.min(...Object.values(e.pointsDelta)) : 0;
  switch (e.type) {
    case "accusationCorrect":
      return { sound: sfx.alarm, shake: true, burst: "⚔️" };
    case "missionSuccess":
      return { sound: sfx.legendary, shake: false, burst: "✨" };
    case "chestEarned":
      return { sound: sfx.chest, shake: false, burst: "🎁" };
    case "lootPlundered":
      return { sound: sfx.lose, shake: true, burst: "💥" };
    case "itemTriggered":
      return minDelta < 0
        ? { sound: sfx.boom, shake: true, burst: "💥" }
        : { sound: sfx.sting, shake: false, burst: "✨" };
    case "itemBlocked":
      return { sound: sfx.sting, shake: false, burst: "🛡️" };
    case "finalAction":
      return minDelta < 0
        ? { sound: sfx.boom, shake: true, burst: "💥" }
        : { sound: sfx.sting, shake: false };
    case "pairResult":
      return minDelta < 0 || e.title.includes("BETRAYAL")
        ? { sound: sfx.boom, shake: true, burst: "🗡️" }
        : { sound: sfx.coins, shake: false, burst: "🪙" };
    case "correctAnswer":
      return { sound: sfx.sting, shake: false };
    case "chaseMove":
      return {
        sound: sfx.whoosh,
        shake: e.title.includes("CAUGHT"),
        burst: e.title.includes("CAUGHT") ? "⚓" : undefined,
      };
    default:
      return maxDelta > 0
        ? { sound: sfx.coins, shake: false, burst: "🪙" }
        : { sound: sfx.tap, shake: false };
  }
}

/**
 * The reveal queue: every score change plays out one event at a time with
 * slam-in cards, screen shake, coin bursts and a sound per event.
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
    sfx.drum();
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= events.length; i++) {
      timers.push(
        setTimeout(() => setShown(i), i === 1 ? 500 : 500 + (i - 1) * TIMING.REVEAL_STEP_MS),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [events]);

  const current: RevealEvent | undefined = shown > 0 ? events[shown - 1] : undefined;

  // Fire the sound exactly once per newly shown event.
  useEffect(() => {
    if (!current) return;
    eventFeel(current).sound();
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!game) return null;
  const history = events
    .slice(0, Math.max(0, shown - 1))
    .slice(-4)
    .reverse();
  const feel = current ? eventFeel(current) : undefined;
  const bigWin =
    current &&
    (current.type === "missionSuccess" ||
      current.type === "accusationCorrect" ||
      (current.pointsDelta && Math.max(...Object.values(current.pointsDelta)) >= 150));

  return (
    <Screen className="items-center gap-4">
      {bigWin && <Confetti count={35} />}
      <motion.h1
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="pt-2 font-display text-3xl text-neon-gold title-glow"
      >
        The Reveal 🔥
      </motion.h1>

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
        <Shaker trigger={feel?.shake ? current?.id : undefined}>
          <AnimatePresence mode="wait">
            {current ? (
              <motion.div
                key={current.id}
                initial={{ scale: 0.3, opacity: 0, rotate: -6, y: -40 }}
                animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40, rotate: 3 }}
                transition={{ type: "spring", stiffness: 280, damping: 16 }}
                className={`neon-card relative w-full max-w-sm border-2 p-6 text-center ${TYPE_STYLES[current.type] ?? "border-white/20"}`}
                role="status"
              >
                {feel?.burst && <EmojiBurst emoji={feel.burst} count={10} distance={110} />}
                {current.icon && (
                  <motion.div
                    className="text-6xl"
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: [0, 1.4, 1], rotate: 0 }}
                    transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                    aria-hidden
                  >
                    {current.icon}
                  </motion.div>
                )}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-2 font-display text-2xl text-outline"
                >
                  {current.title}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-1.5 text-sm text-slate-200"
                >
                  {current.description}
                </motion.p>
                {current.pointsDelta && <DeltaRow delta={current.pointsDelta} />}
              </motion.div>
            ) : (
              <motion.div
                key="drumroll"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <motion.span
                  className="text-6xl"
                  animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  aria-hidden
                >
                  🥁
                </motion.span>
                <span className="animate-shimmer font-display text-2xl text-neon-cyan">
                  Drumroll...
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Shaker>

        <div className="flex w-full max-w-sm flex-col gap-1.5" aria-label="Previous reveals">
          <AnimatePresence>
            {history.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 text-xs text-slate-400"
              >
                <span aria-hidden>{e.icon}</span>
                <span className="truncate">{e.title}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex w-full max-w-sm items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          {events.map((e, i) => (
            <span
              key={e.id}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${i < shown ? "bg-neon-gold" : "bg-white/20"}`}
              aria-hidden
            />
          ))}
          <span className="ml-1">
            {Math.min(shown, events.length)}/{events.length}
          </span>
        </div>
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
      {entries.map(([id, d], i) => {
        const p = game.players.find((x) => x.id === id);
        if (!p) return null;
        return (
          <motion.span
            key={id}
            initial={{ scale: 0, y: 14 }}
            animate={{ scale: [0, 1.35, 1], y: 0 }}
            transition={{ type: "spring", stiffness: 380, delay: 0.35 + i * 0.1 }}
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
