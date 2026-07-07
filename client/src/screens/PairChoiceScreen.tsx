import { motion } from "framer-motion";
import { useState } from "react";
import type { PlunderChoice } from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { Screen, TimerBar } from "../components/ui";

const CHOICES: Array<{
  id: PlunderChoice;
  icon: string;
  name: string;
  blurb: string;
  cls: string;
}> = [
  {
    id: "split",
    icon: "🤝",
    name: "Split",
    blurb: "Share the pot fairly. Trust wins... if they trust too.",
    cls: "border-neon-green/60 shadow-neon-green",
  },
  {
    id: "plunder",
    icon: "🗡️",
    name: "Plunder",
    blurb: "Take almost everything. Unless they guard. Or plunder too.",
    cls: "border-neon-pink/60 shadow-neon-pink",
  },
  {
    id: "guard",
    icon: "🛡️",
    name: "Guard",
    blurb: "Block a plunder for a counter-bonus. Paranoia pays. Sometimes.",
    cls: "border-neon-cyan/60 shadow-neon-cyan",
  },
];

export function PairChoiceScreen() {
  const game = useGameStore((s) => s.game);
  const playerId = useGameStore((s) => s.playerId);
  const [picked, setPicked] = useState<PlunderChoice | undefined>();
  if (!game) return null;

  const myPair = game.pairs?.find((p) => p.aId === playerId || p.bId === playerId);
  const partnerId = myPair ? (myPair.aId === playerId ? myPair.bId : myPair.aId) : undefined;
  const partner = game.players.find((p) => p.id === partnerId);
  const solo = myPair && myPair.aId === myPair.bId;

  const choose = (c: PlunderChoice) => {
    setPicked(c);
    socket.emit("pair:choose", c);
  };

  return (
    <Screen className="items-center justify-center gap-5 text-center">
      <div className="w-full">
        <TimerBar endsAt={game.timerEndsAt} />
      </div>
      <h1 className="font-display text-4xl text-neon-gold title-glow">⚖️ Split or Plunder</h1>
      {solo ? (
        <p className="text-slate-300">
          You sail alone this round — your fate rests on your answer. 🐺
        </p>
      ) : partner ? (
        <p className="text-base">
          Your partner in crime:{" "}
          <b>
            {partner.avatar} {partner.nickname}
          </b>
          <br />
          <span className="text-sm text-slate-400">
            The pot: 🪙 {myPair?.potSize}. Choose in secret. Look them in the eye.
          </span>
        </p>
      ) : (
        <p className="text-slate-400">Watching the drama unfold...</p>
      )}

      {!solo && myPair && (
        <div className="flex w-full max-w-xs flex-col gap-3">
          {CHOICES.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => choose(c.id)}
              className={`neon-card border-2 p-4 text-left transition ${c.cls} ${
                picked === c.id ? "bg-white/10 ring-2 ring-neon-gold" : picked ? "opacity-40" : ""
              }`}
              aria-pressed={picked === c.id}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden>
                  {c.icon}
                </span>
                <div>
                  <div className="font-display text-xl">{c.name}</div>
                  <div className="text-xs text-slate-300">{c.blurb}</div>
                </div>
              </div>
            </motion.button>
          ))}
          {picked && (
            <p className="text-sm text-neon-cyan">
              Choice sealed 🤐 — you can still switch until time runs out.
            </p>
          )}
        </div>
      )}
    </Screen>
  );
}
