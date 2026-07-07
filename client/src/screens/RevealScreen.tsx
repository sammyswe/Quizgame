import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TIMING, type RevealEvent } from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { Confetti, Screen } from "../components/ui";
import { EmojiBurst, Shaker } from "../components/fx";
import { CannonBlast } from "../components/effects/CannonBlast";
import { ImpactFlash } from "../components/gamefeel/ImpactFlash";
import { particleCount, shakeAllowed, useGameFeel } from "../lib/gameFeel";
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
type EventFeel = {
  sound: () => void;
  shake: boolean;
  burst?: string;
  /** Full-card/screen overlay effect keyed off shared animation metadata. */
  overlay?: "cannon" | "plunder" | "curse" | "mutiny" | "duel" | "mission";
  flash?: string;
  /** Card entrance uses a 3D map flip instead of the slam. */
  flip?: boolean;
};

function eventFeel(e: RevealEvent): EventFeel {
  const maxDelta = e.pointsDelta ? Math.max(...Object.values(e.pointsDelta)) : 0;
  const minDelta = e.pointsDelta ? Math.min(...Object.values(e.pointsDelta)) : 0;
  const big = e.intensity === "big";
  const negative = minDelta < 0;

  switch (e.animation) {
    case "mutiny":
      return { sound: sfx.alarm, shake: true, burst: "⚔️", overlay: "mutiny", flash: "#fb7185" };
    case "mission":
      return { sound: sfx.legendary, shake: false, burst: "✨", overlay: "mission" };
    case "chest":
      return { sound: sfx.chest, shake: false, burst: "🎁" };
    case "plunder":
      return {
        sound: sfx.lose,
        shake: true,
        burst: "💥",
        overlay: "plunder",
        flash: negative ? "#fb7185" : undefined,
      };
    case "cannon":
      return negative
        ? {
            sound: sfx.boom,
            shake: true,
            burst: "💥",
            overlay: "cannon",
            flash: big ? "#fb923c" : undefined,
          }
        : { sound: sfx.sting, shake: false, burst: "✨" };
    case "curse":
      return { sound: sfx.legendary, shake: big, burst: "☠️", overlay: "curse", flash: "#4ade80" };
    case "duel":
      return negative || e.title.includes("BETRAYAL")
        ? { sound: sfx.boom, shake: true, burst: "🗡️", overlay: "duel" }
        : { sound: sfx.coins, shake: false, burst: "🪙" };
    case "mapFlip":
      return { sound: sfx.sting, shake: false, flip: true };
    case "coinBurst":
      return maxDelta > 0
        ? { sound: sfx.coins, shake: false, burst: "🪙" }
        : { sound: sfx.tap, shake: false };
    case "wave":
    default:
      if (e.type === "chaseMove" && e.title.includes("CAUGHT")) {
        return { sound: sfx.boom, shake: true, burst: "⚓", overlay: "cannon" };
      }
      return maxDelta > 0
        ? { sound: sfx.coins, shake: false, burst: "🪙" }
        : { sound: sfx.whoosh, shake: false };
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
  const intensity = useGameFeel((s) => s.intensity);
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
      {bigWin && <Confetti count={particleCount(35, intensity)} />}
      {feel?.flash && current && (
        <ImpactFlash key={`flash-${current.id}`} color={feel.flash} opacity={0.3} />
      )}
      <motion.h1
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="pt-2 font-display text-3xl text-neon-gold title-glow"
      >
        The Reveal 🔥
      </motion.h1>

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
        <Shaker trigger={feel?.shake && shakeAllowed(intensity) ? current?.id : undefined}>
          <AnimatePresence mode="wait">
            {current ? (
              <motion.div
                key={current.id}
                initial={
                  feel?.flip
                    ? { rotateY: 90, opacity: 0, scale: 0.9 }
                    : { scale: 0.3, opacity: 0, rotate: -6, y: -40 }
                }
                animate={
                  feel?.flip
                    ? { rotateY: 0, opacity: 1, scale: 1 }
                    : { scale: 1, opacity: 1, rotate: 0, y: 0 }
                }
                exit={{ scale: 0.9, opacity: 0, y: 40, rotate: 3 }}
                transition={{ type: "spring", stiffness: 280, damping: 16 }}
                className={`neon-card relative w-full max-w-sm border-2 p-6 text-center ${TYPE_STYLES[current.type] ?? "border-white/20"}`}
                style={{ transformPerspective: 800 }}
                role="status"
              >
                {feel?.burst && (
                  <EmojiBurst
                    emoji={feel.burst}
                    count={particleCount(10, intensity)}
                    distance={110}
                  />
                )}
                {feel?.overlay === "cannon" && <CannonBlast />}
                {feel?.overlay === "plunder" && (
                  <>
                    <CannonBlast small />
                    <SinkingCoins count={particleCount(6, intensity)} />
                  </>
                )}
                {feel?.overlay === "curse" && <CurseAura />}
                {feel?.overlay === "mutiny" && <MutinyStamp />}
                {feel?.overlay === "duel" && <DuelClash />}
                {feel?.overlay === "mission" && (
                  <EmojiBurst
                    emoji="🎭"
                    count={particleCount(6, intensity)}
                    distance={90}
                    duration={1.2}
                  />
                )}
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
            Skip ⏭️
          </button>
        )}
      </div>
    </Screen>
  );
}

/** Coins tumbling down and sinking — loot lost to the sea. */
function SinkingCoins({ count = 6 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          className="absolute text-xl"
          style={{ left: `${15 + ((i * 137) % 70)}%`, top: "30%" }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{ y: 160, opacity: [1, 1, 0], rotate: i % 2 ? 260 : -260 }}
          transition={{ duration: 1.3, delay: 0.3 + i * 0.12, ease: "easeIn" }}
        >
          🪙
        </motion.span>
      ))}
    </div>
  );
}

/** Green cursed aura expanding rings. */
function CurseAura() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-emerald-400/70"
          style={{ width: 50, height: 50 }}
          initial={{ scale: 0.5, opacity: 0.9 }}
          animate={{ scale: 4 + i, opacity: 0 }}
          transition={{ duration: 1.1, delay: i * 0.2, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/** Big red MUTINY! ink stamp slammed over the card. */
function MutinyStamp() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      aria-hidden
    >
      <motion.div
        initial={{ scale: 3, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: -14 }}
        transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.25 }}
        className="rounded-xl border-4 border-rose-400 bg-rose-950/60 px-6 py-2 font-display text-4xl tracking-widest text-rose-300 shadow-neon-pink"
      >
        MUTINY!
      </motion.div>
    </div>
  );
}

/** Two bombs collide from the sides — broadside duel / betrayal clash. */
function DuelClash() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      aria-hidden
    >
      <motion.span
        className="absolute text-4xl"
        initial={{ x: -140, rotate: -40 }}
        animate={{ x: -14, rotate: 10 }}
        transition={{ duration: 0.4, ease: "easeIn" }}
      >
        💣
      </motion.span>
      <motion.span
        className="absolute text-4xl"
        initial={{ x: 140, rotate: 40 }}
        animate={{ x: 14, rotate: -10 }}
        transition={{ duration: 0.4, ease: "easeIn" }}
      >
        💣
      </motion.span>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <CannonBlast small />
      </motion.div>
    </div>
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
