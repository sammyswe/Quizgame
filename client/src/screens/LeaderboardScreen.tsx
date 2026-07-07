import { motion } from "framer-motion";
import { useMemo } from "react";
import { ROUNDS } from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { AnimatedNumber, Screen, TimerBar } from "../components/ui";

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardScreen() {
  const game = useGameStore((s) => s.game);
  const playerId = useGameStore((s) => s.playerId);
  const isHost = useGameStore((s) => s.isHost());
  const sorted = useMemo(
    () => (game ? [...game.players].sort((a, b) => a.rank - b.rank) : []),
    [game],
  );
  if (!game) return null;
  const nextRound = game.roundPlan[game.roundIndex + 1];

  return (
    <Screen className="gap-4">
      <TimerBar endsAt={game.timerEndsAt} />
      <h1 className="text-center font-display text-4xl text-neon-gold title-glow">🏆 The Ledger</h1>

      <div className="flex flex-col gap-2">
        {sorted.map((p, i) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, type: "spring", stiffness: 150 }}
            className={`neon-card flex items-center gap-3 border-2 p-3.5 ${
              i === 0
                ? "border-neon-gold/70 shadow-neon-gold"
                : p.id === playerId
                  ? "border-neon-cyan/50 shadow-neon-cyan"
                  : "border-white/10"
            }`}
          >
            <span className="w-8 text-center font-display text-2xl">{MEDALS[i] ?? `#${p.rank}`}</span>
            <span className="text-2xl" aria-hidden>
              {p.avatar}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-black">
                {p.nickname} {p.id === playerId && <span className="text-xs text-neon-cyan">(you)</span>}
              </div>
              <div className="flex gap-2 text-[11px] text-slate-400">
                {p.streak >= 2 && <span>🔥 {p.streak} streak</span>}
                {p.chestCount > 0 && <span>🎁 ×{p.chestCount}</span>}
                {p.itemCount > 0 && <span>🎒 ×{p.itemCount}</span>}
              </div>
            </div>
            <div className="text-right font-display text-2xl text-neon-gold">
              🪙 <AnimatedNumber value={p.score} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto text-center">
        {nextRound ? (
          <p className="text-sm text-slate-300">
            Next: <b>{ROUNDS[nextRound].icon} {ROUNDS[nextRound].name}</b>
            <br />
            <span className="text-xs text-slate-500">{ROUNDS[nextRound].tagline}</span>
          </p>
        ) : (
          <p className="animate-shimmer font-display text-xl text-neon-red">Final Plunder begins...</p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          💡 Now's a good moment to open chests from your 🎒 bag.
        </p>
        {isHost && (
          <button className="btn-ghost mt-2 !min-h-0 !px-4 !py-2 !text-sm" onClick={() => socket.emit("phase:advance")}>
            Sail on ⏭️
          </button>
        )}
      </div>
    </Screen>
  );
}
