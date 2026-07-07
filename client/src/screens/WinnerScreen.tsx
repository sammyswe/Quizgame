import { motion } from "framer-motion";
import { useMemo } from "react";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { AnimatedNumber, Confetti, Screen } from "../components/ui";

export function WinnerScreen() {
  const game = useGameStore((s) => s.game);
  const isHost = useGameStore((s) => s.isHost());
  const leave = useGameStore((s) => s.leave);
  const sorted = useMemo(
    () => (game ? [...game.players].sort((a, b) => b.score + b.roundLoot - (a.score + a.roundLoot)) : []),
    [game],
  );
  if (!game) return null;
  const winner = sorted.find((p) => p.id === game.winnerId) ?? sorted[0];
  const runnersUp = sorted.filter((p) => p.id !== winner?.id);

  return (
    <Screen className="items-center justify-center gap-6 text-center">
      <Confetti count={70} />
      <motion.div
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 12, delay: 0.3 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="text-2xl font-black uppercase tracking-[0.3em] text-neon-cyan">
          The richest pirate
        </div>
        <motion.div
          className="text-8xl"
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          aria-hidden
        >
          {winner?.avatar}
        </motion.div>
        <h1 className="font-display text-6xl text-neon-gold title-glow">{winner?.nickname}</h1>
        <div className="font-display text-4xl text-neon-gold">
          👑 🪙 <AnimatedNumber value={winner?.score ?? 0} />
        </div>
        <p className="text-sm text-slate-300">wins the voyage and eternal bragging rights.</p>
      </motion.div>

      <div className="flex w-full max-w-xs flex-col gap-1.5">
        {runnersUp.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.15 }}
            className="neon-card flex items-center gap-2 px-4 py-2 text-sm"
          >
            <span className="font-display text-slate-400">#{i + 2}</span>
            <span aria-hidden>{p.avatar}</span>
            <span className="flex-1 truncate text-left font-bold">{p.nickname}</span>
            <span className="font-display text-neon-gold">🪙 {p.score}</span>
          </motion.div>
        ))}
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        {isHost && (
          <button className="btn-gold w-full" onClick={() => socket.emit("game:playAgain")}>
            ⚓ Sail Again (same crew)
          </button>
        )}
        <button className="btn-ghost w-full" onClick={leave}>
          Abandon ship 🏝️
        </button>
      </div>
    </Screen>
  );
}
