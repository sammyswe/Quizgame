import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { AnimatedNumber, Screen, TimerBar } from "../components/ui";
import { PirateAvatar } from "../components/players/PirateAvatar";
import { sfx } from "../lib/sfx";

/** Remember last round's ranks so we can show movement arrows + new-leader drama. */
let previousRanks: Record<string, number> = {};
let previousLeaderId: string | undefined;

export function LeaderboardScreen() {
  const game = useGameStore((s) => s.game);
  const playerId = useGameStore((s) => s.playerId);
  const isHost = useGameStore((s) => s.isHost());
  const sorted = useMemo(
    () => (game ? [...game.players].sort((a, b) => a.rank - b.rank) : []),
    [game],
  );

  const leaderId = sorted[0]?.id;
  const newLeader = Boolean(leaderId && previousLeaderId && leaderId !== previousLeaderId);
  const movements = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of sorted) {
      const prev = previousRanks[p.id];
      map[p.id] = prev === undefined ? 0 : prev - p.rank; // + = climbed
    }
    return map;
  }, [sorted]);

  useEffect(() => {
    sfx.coins();
    if (newLeader) setTimeout(() => sfx.alarm(), 700);
    // Snapshot for next time (after computing movements).
    previousRanks = Object.fromEntries(sorted.map((p) => [p.id, p.rank]));
    previousLeaderId = leaderId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!game) return null;
  const arcade = game.arcade;
  const nextRoundNumber = arcade ? arcade.roundNumber + 1 : 0;
  const nextEventRound = arcade?.eventRounds.find((r) => r >= nextRoundNumber);
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
        THE FLEET LEDGER
      </motion.h1>

      {newLeader && (
        <motion.div
          initial={{ scale: 0, rotate: -6 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 14 }}
          className="relative mx-auto rounded-full border-2 border-[#f2c85b] bg-[#17384c]/95 px-5 py-1.5 font-display text-lg text-[#ffe18a] shadow-xl"
        >
          NEW CAPTAIN: {sorted[0]?.nickname}
        </motion.div>
      )}

      <div className="flex flex-col gap-2">
        {sorted.map((p, i) => {
          const move = movements[p.id] ?? 0;
          const isLast = i === sorted.length - 1 && sorted.length >= 3;
          return (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, x: i % 2 === 0 ? -80 : 80, rotate: i % 2 === 0 ? -2 : 2 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ delay: 0.2 + i * 0.16, type: "spring", stiffness: 220, damping: 18 }}
              className={`pirate-panel relative flex items-center gap-3 overflow-hidden p-3 ${
                i === 0
                  ? "border-neon-gold/70 shadow-neon-gold"
                  : isLast
                    ? "border-neon-red/40"
                    : p.id === playerId
                      ? "border-neon-cyan/50 shadow-neon-cyan"
                      : "border-white/10"
              }`}
            >
              {/* Score bar racing behind the row */}
              <motion.div
                className={`absolute inset-y-0 left-0 ${i === 0 ? "bg-amber-400/10" : isLast ? "bg-rose-500/[0.06]" : "bg-white/[0.04]"}`}
                initial={{ width: 0 }}
                animate={{ width: `${(p.score / maxScore) * 100}%` }}
                transition={{ delay: 0.5 + i * 0.16, duration: 0.7, ease: "easeOut" }}
                aria-hidden
              />
              <motion.span
                className="relative w-8 text-center font-display text-2xl"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.4, 1] }}
                transition={{ delay: 0.35 + i * 0.16, duration: 0.4 }}
              >
                #{p.rank}
              </motion.span>
              <div className="relative">
                <PirateAvatar
                  playerId={p.id}
                  emoji={p.avatar}
                  size={40}
                  bobDelay={i * 0.3}
                  mood={i === 0 ? "winner" : isLast ? "nervous" : "idle"}
                />
              </div>
              <div className="relative min-w-0 flex-1">
                <div className="flex items-center gap-1 truncate font-black">
                  {p.nickname}
                  {p.id === playerId && <span className="text-xs text-neon-cyan">(you)</span>}
                  {move > 0 && (
                    <motion.span
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8 + i * 0.16 }}
                      className="text-xs font-black text-neon-green"
                      aria-label={`climbed ${move} places`}
                    >
                      ▲{move}
                    </motion.span>
                  )}
                  {move < 0 && (
                    <motion.span
                      initial={{ y: -8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8 + i * 0.16 }}
                      className="text-xs font-black text-neon-red"
                      aria-label={`dropped ${-move} places`}
                    >
                      ▼{-move}
                    </motion.span>
                  )}
                </div>
                <div className="flex gap-2 text-[11px] text-slate-400">
                  {p.streak >= 2 && <span>{p.streak} streak</span>}
                  {p.chestCount > 0 && <span>{p.chestCount} chest</span>}
                  {p.itemCount > 0 && <span>{p.itemCount} item</span>}
                  {isLast && <span className="text-neon-red/80">shark territory</span>}
                </div>
              </div>
              <div className="relative text-right font-display text-2xl text-neon-gold">
                <AnimatedNumber value={p.score} /> gold
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-auto text-center">
        {arcade && nextRoundNumber <= arcade.totalRounds ? (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-sm text-slate-300"
          >
            Next: <b>Round {nextRoundNumber}</b> of {arcade.totalRounds}
            {nextEventRound && (
              <>
                <br />
                <span className="text-xs text-neon-gold">
                  {nextEventRound === nextRoundNumber ? "SPECIAL VOYAGE NOW" : `Special voyage after question ${nextEventRound}`}
                </span>
              </>
            )}
          </motion.p>
        ) : (
          <p className="animate-shimmer font-display text-xl text-neon-red">The final tally...</p>
        )}
        <p className="mt-2 text-xs text-slate-400">Open any waiting chests before the fleet moves on.</p>
        {isHost && (
          <button
            className="btn-ghost mt-2 !min-h-0 !px-4 !py-2 !text-sm"
            onClick={() => socket.emit("phase:advance")}
          >
            Next question
          </button>
        )}
      </div>
    </Screen>
  );
}
