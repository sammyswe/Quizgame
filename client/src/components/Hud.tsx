import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { AnimatedNumber } from "./ui";
import { FloatingText } from "./gamefeel/FloatingText";
import { PirateAvatar } from "./players/PirateAvatar";

/** Top HUD: my pirate, my gold with floating +/- deltas, rank, live ticker. */
export function Hud() {
  const game = useGameStore((s) => s.game);
  const me = useGameStore((s) => s.me());
  const [delta, setDelta] = useState<{ value: number; key: number } | undefined>();
  const prevTotal = useRef<number | undefined>(undefined);

  const total = me ? me.score + me.roundLoot : undefined;

  // Score ticker: float a +/- delta whenever my total changes.
  useEffect(() => {
    if (total === undefined) return;
    if (prevTotal.current !== undefined && total !== prevTotal.current) {
      setDelta({ value: total - prevTotal.current, key: Date.now() });
      const t = setTimeout(() => setDelta(undefined), 1300);
      prevTotal.current = total;
      return () => clearTimeout(t);
    }
    prevTotal.current = total;
  }, [total]);

  if (!game || !me) return null;
  const latestTicker = game.ticker[game.ticker.length - 1];

  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-abyss/90 pb-2 pt-2.5 backdrop-blur">
      <div className="mx-auto w-full max-w-md px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PirateAvatar playerId={me.id} emoji={me.avatar} size={36} />
            <div>
              <div className="text-sm font-black leading-tight">{me.nickname}</div>
              <div className="text-[11px] text-slate-400">
                Rank #{me.rank} · Room {game.roomCode}
              </div>
            </div>
          </div>
          <div className="relative flex items-center gap-3">
            {delta && (
              <FloatingText
                key={delta.key}
                text={`${delta.value > 0 ? "+" : ""}${delta.value}`}
                color={delta.value > 0 ? "#4ade80" : "#fb7185"}
                size="text-xl"
              />
            )}
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
            <motion.div
              className="text-right"
              key={me.score}
              initial={{ scale: 1 }}
              animate={{ scale: [1.18, 1] }}
              transition={{ duration: 0.3 }}
            >
              <div className="font-display text-xl text-neon-gold title-glow">
                🪙 <AnimatedNumber value={me.score} />
              </div>
              <div className="whitespace-nowrap text-[10px] uppercase tracking-wide text-slate-500">
                banked gold
              </div>
            </motion.div>
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
