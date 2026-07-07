import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../store/gameStore";
import { AnimatedNumber } from "./ui";

/** Top HUD: room code, my gold, rank, live ticker. Always visible in-game. */
export function Hud() {
  const game = useGameStore((s) => s.game);
  const me = useGameStore((s) => s.me());
  if (!game || !me) return null;
  const latestTicker = game.ticker[game.ticker.length - 1];

  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-abyss/90 pb-2 pt-3 backdrop-blur">
      <div className="mx-auto w-full max-w-md px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              {me.avatar}
            </span>
            <div>
              <div className="text-sm font-black leading-tight">{me.nickname}</div>
              <div className="text-[11px] text-slate-400">
                Rank #{me.rank} · Room {game.roomCode}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {me.roundLoot !== 0 && (
              <div className="text-right">
                <div className="font-display text-sm text-neon-green">
                  {me.roundLoot > 0 ? "+" : ""}
                  <AnimatedNumber value={me.roundLoot} />
                </div>
                <div className="whitespace-nowrap text-[10px] uppercase tracking-wide text-slate-500">
                  unbanked
                </div>
              </div>
            )}
            <div className="text-right">
              <div className="font-display text-xl text-neon-gold title-glow">
                🪙 <AnimatedNumber value={me.score} />
              </div>
              <div className="whitespace-nowrap text-[10px] uppercase tracking-wide text-slate-500">
                banked gold
              </div>
            </div>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {latestTicker && (
            <motion.div
              key={latestTicker}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-1.5 truncate text-center text-xs text-neon-cyan/90"
            >
              {latestTicker}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
