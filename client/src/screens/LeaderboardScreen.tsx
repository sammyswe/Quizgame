import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { ROUNDS } from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { AnimatedNumber, Screen, TimerBar } from "../components/ui";
import { sfx } from "../lib/sfx";

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardScreen() {
  const game = useGameStore((s) => s.game);
  const playerId = useGameStore((s) => s.playerId);
  const isHost = useGameStore((s) => s.isHost());
  const sorted = useMemo(
    () => (game ? [...game.players].sort((a, b) => a.rank - b.rank) : []),
    [game],
  );

  useEffect(() => {
    sfx.coins();
  }, []);

  if (!game) return null;
  const nextRound = game.roundPlan[game.roundIndex + 1];
  const maxScore = Math.max(1, ...sorted.map((p) => p.score));

  return (
    <Screen className="gap-4">
      <TimerBar endsAt={game.timerEndsAt} />
      <motion.h1
        initial={{ scale: 0.5, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="text-center font-display text-4xl text-neon-gold title-glow"
      >
        🏆 The Ledger
      </motion.h1>

      <div className="flex flex-col gap-2">
        {sorted.map((p, i) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, x: i % 2 === 0 ? -80 : 80, rotate: i % 2 === 0 ? -2 : 2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ delay: 0.2 + i * 0.16, type: "spring", stiffness: 220, damping: 18 }}
            className={`neon-card relative flex items-center gap-3 overflow-hidden border-2 p-3.5 ${
              i === 0
                ? "border-neon-gold/70 shadow-neon-gold"
                : p.id === playerId
                  ? "border-neon-cyan/50 shadow-neon-cyan"
                  : "border-white/10"
            }`}
          >
            {/* Score bar racing behind the row */}
            <motion.div
              className={`absolute inset-y-0 left-0 ${i === 0 ? "bg-amber-400/10" : "bg-white/[0.04]"}`}
              initial={{ width: 0 }}
              animate={{ width: `${(p.score / maxScore) * 100}%` }}
              transition={{ delay: 0.5 + i * 0.16, duration: 0.7, ease: "easeOut" }}
              aria-hidden
            />
            {i === 0 && (
              <motion.span
                className="absolute -top-0.5 left-6 text-lg"
                animate={{ rotate: [-8, 8, -8], y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                aria-hidden
              >
                👑
              </motion.span>
            )}
            <motion.span
              className="relative w-8 text-center font-display text-2xl"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.4, 1] }}
              transition={{ delay: 0.35 + i * 0.16, duration: 0.4 }}
            >
              {MEDALS[i] ?? `#${p.rank}`}
            </motion.span>
            <span className="relative text-2xl" aria-hidden>
              {p.avatar}
            </span>
            <div className="relative min-w-0 flex-1">
              <div className="truncate font-black">
                {p.nickname}{" "}
                {p.id === playerId && <span className="text-xs text-neon-cyan">(you)</span>}
              </div>
              <div className="flex gap-2 text-[11px] text-slate-400">
                {p.streak >= 2 && <span>🔥 {p.streak} streak</span>}
                {p.chestCount > 0 && <span>🎁 ×{p.chestCount}</span>}
                {p.itemCount > 0 && <span>🎒 ×{p.itemCount}</span>}
              </div>
            </div>
            <div className="relative text-right font-display text-2xl text-neon-gold">
              🪙 <AnimatedNumber value={p.score} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto text-center">
        {nextRound ? (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-sm text-slate-300"
          >
            Next:{" "}
            <b>
              {ROUNDS[nextRound].icon} {ROUNDS[nextRound].name}
            </b>
            <br />
            <span className="text-xs text-slate-500">{ROUNDS[nextRound].tagline}</span>
          </motion.p>
        ) : (
          <p className="animate-shimmer font-display text-xl text-neon-red">
            Final Plunder begins...
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          💡 Now's a good moment to open chests from your 🎒 bag.
        </p>
        {isHost && (
          <button
            className="btn-ghost mt-2 !min-h-0 !px-4 !py-2 !text-sm"
            onClick={() => socket.emit("phase:advance")}
          >
            Sail on ⏭️
          </button>
        )}
      </div>
    </Screen>
  );
}
