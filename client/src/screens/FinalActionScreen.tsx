import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FINAL_ACTIONS, type FinalActionId } from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { PlayerChip, Screen, TimerBar } from "../components/ui";

export function FinalActionScreen() {
  const game = useGameStore((s) => s.game);
  const priv = useGameStore((s) => s.priv);
  const playerId = useGameStore((s) => s.playerId);
  const [picking, setPicking] = useState<FinalActionId | undefined>();
  const [chosen, setChosen] = useState<FinalActionId | undefined>();

  useEffect(() => {
    setPicking(undefined);
    setChosen(undefined);
  }, [game?.finalPlunder?.questionNumber]);

  if (!game?.finalPlunder) return null;
  const actionsIn = new Set(game.finalPlunder.actionsIn);
  const offered = priv?.finalActions ?? [];

  const pick = (id: FinalActionId) => {
    const def = FINAL_ACTIONS[id];
    if (def.needsTarget) {
      setPicking(id);
    } else {
      socket.emit("final:action", { actionId: id });
      setChosen(id);
      setPicking(undefined);
    }
  };

  return (
    <Screen className="gap-4">
      <TimerBar endsAt={game.timerEndsAt} />
      <div className="text-center">
        <h1 className="font-display text-4xl text-neon-red title-glow">🏴‍☠️ FINAL PLUNDER</h1>
        <p className="text-sm text-slate-300">
          Question {game.finalPlunder.questionNumber} of {game.finalPlunder.totalQuestions} — choose
          your secret move. Part of your gold is protected. The rest? Fair game.
        </p>
      </div>

      {picking ? (
        <div className="neon-card border-neon-pink/50 p-4">
          <p className="mb-2 text-center text-sm font-bold">
            {FINAL_ACTIONS[picking].icon} {FINAL_ACTIONS[picking].name} — choose your target:
          </p>
          <div className="flex flex-col gap-1.5">
            {game.players
              .filter((p) => p.id !== playerId)
              .map((p) => (
                <button
                  key={p.id}
                  className="btn-ghost justify-start"
                  onClick={() => {
                    socket.emit("final:action", { actionId: picking, targetId: p.id });
                    setChosen(picking);
                    setPicking(undefined);
                  }}
                >
                  {p.avatar} {p.nickname} — #{p.rank} · 🪙{p.score}
                </button>
              ))}
            <button className="btn-ghost !text-sm" onClick={() => setPicking(undefined)}>
              ← Back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {offered.map((id, i) => {
            const def = FINAL_ACTIONS[id];
            const isChosen = chosen === id;
            return (
              <motion.button
                key={id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => pick(id)}
                className={`neon-card border-2 p-4 text-left ${
                  isChosen
                    ? "border-neon-gold ring-2 ring-neon-gold shadow-neon-gold bg-white/10"
                    : chosen
                      ? "border-white/10 opacity-40"
                      : "border-neon-purple/50 hover:shadow-neon-purple"
                }`}
                aria-pressed={isChosen}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden>
                    {def.icon}
                  </span>
                  <div className="flex-1">
                    <div className="font-display text-lg">
                      {def.name} {isChosen && "🔒"}
                    </div>
                    <div className="text-xs text-slate-300">{def.description}</div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {game.players.map((p) => (
          <PlayerChip
            key={p.id}
            player={p}
            highlight={actionsIn.has(p.id)}
            suffix={<span>{actionsIn.has(p.id) ? "🗡️" : "🤔"}</span>}
          />
        ))}
      </div>
    </Screen>
  );
}
