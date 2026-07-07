import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { PlayerChip, Screen, TimerBar } from "../components/ui";
import { sfx } from "../lib/sfx";

export function AuctionScreen() {
  const game = useGameStore((s) => s.game);
  const me = useGameStore((s) => s.me());
  const [bid, setBid] = useState(0);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setBid(0);
    setSent(false);
  }, [game?.auction?.prizeId]);

  if (!game?.auction || !me) return null;
  const budget = me.score + me.roundLoot;
  const bidsIn = new Set(game.auction.bidsIn);

  const submit = () => {
    sfx.lock();
    socket.emit("auction:bid", bid);
    setSent(true);
  };

  return (
    <Screen className="items-center gap-5 text-center">
      <div className="w-full">
        <TimerBar endsAt={game.timerEndsAt} />
      </div>
      <h1 className="font-display text-3xl text-neon-gold title-glow">🔨 Treasure Auction</h1>

      <motion.div
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className="neon-card w-full max-w-xs border-neon-gold/50 p-6 shadow-neon-gold"
      >
        <div className="text-7xl animate-floaty" aria-hidden>
          {game.auction.prizeIcon}
        </div>
        <h2 className="mt-2 font-display text-2xl text-neon-gold">{game.auction.prizeName}</h2>
        <p className="mt-1 text-sm text-slate-300">{game.auction.prizeDescription}</p>
      </motion.div>

      <div className="w-full max-w-xs">
        <p className="mb-2 text-sm font-bold text-slate-300">
          Secret bid — highest bidder pays & wins. You have 🪙 {budget}.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={Math.max(0, budget)}
            step={5}
            value={bid}
            onChange={(e) => {
              setBid(Number(e.target.value));
              setSent(false);
            }}
            className="flex-1 accent-amber-400"
            aria-label="Bid amount"
          />
          <span className="w-16 text-right font-display text-2xl text-neon-gold tabular-nums">
            {bid}
          </span>
        </div>
        <button className="btn-gold mt-3 w-full" onClick={submit} disabled={sent}>
          {sent
            ? `Bid sealed: ${bid} 🤐`
            : bid === 0
              ? "Bid nothing (coward)"
              : `Seal secret bid: ${bid}`}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {game.players.map((p) => (
          <PlayerChip
            key={p.id}
            player={p}
            highlight={bidsIn.has(p.id)}
            suffix={<span>{bidsIn.has(p.id) ? "🤐" : "🤔"}</span>}
          />
        ))}
      </div>
    </Screen>
  );
}
