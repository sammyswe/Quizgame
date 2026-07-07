import { motion } from "framer-motion";
import { useState } from "react";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";

/**
 * The player's secret mission. Clearly marked PRIVATE. Missions that need a
 * target or a trap answer get inline pickers.
 */
export function MissionCard() {
  const priv = useGameStore((s) => s.priv);
  const game = useGameStore((s) => s.game);
  const playerId = useGameStore((s) => s.playerId);
  const [expanded, setExpanded] = useState(true);
  const mission = priv?.mission;
  if (!mission || !game) return null;

  const needsTarget = mission.def.needsTarget && !mission.targetId;
  const needsOption = mission.def.needsOption && mission.optionIndex === undefined;
  const targetName = game.players.find((p) => p.id === mission.targetId)?.nickname;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 rounded-2xl border border-neon-purple/50 bg-purple-950/40 p-3 shadow-neon-purple"
    >
      <button
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>
            {mission.def.icon}
          </span>
          <span className="font-display text-neon-purple">SECRET MISSION</span>
          <span className="rounded-full bg-neon-purple/20 px-2 py-0.5 text-[10px] font-black uppercase text-neon-purple">
            🔒 private
          </span>
        </div>
        <span className="text-slate-400">{expanded ? "▾" : "▸"}</span>
      </button>
      {expanded && (
        <div className="mt-2 text-sm">
          <p className="font-bold">{mission.def.name}</p>
          <p className="text-slate-300">{mission.def.description}</p>
          {mission.targetId && targetName && (
            <p className="mt-1 text-neon-purple">Target locked: {targetName}</p>
          )}
          {mission.optionIndex !== undefined && game.question && (
            <p className="mt-1 text-neon-purple">
              Trap answer: {game.question.options[mission.optionIndex]}
            </p>
          )}
          {needsTarget && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="w-full text-xs text-slate-400">Pick a target:</span>
              {game.players
                .filter((p) => p.id !== playerId)
                .map((p) => (
                  <button
                    key={p.id}
                    className="rounded-full border border-neon-purple/50 px-2.5 py-1 text-xs font-bold hover:bg-neon-purple/20"
                    onClick={() =>
                      socket.emit("mission:setup", {
                        targetId: p.id,
                        optionIndex: mission.optionIndex,
                      })
                    }
                  >
                    {p.avatar} {p.nickname}
                  </button>
                ))}
            </div>
          )}
          {needsOption && game.question && (
            <div className="mt-2 flex flex-col gap-1.5">
              <span className="text-xs text-slate-400">Pick your trap answer:</span>
              {game.question.options.map((opt, i) => (
                <button
                  key={i}
                  className="rounded-xl border border-neon-purple/50 px-2.5 py-1.5 text-left text-xs font-bold hover:bg-neon-purple/20"
                  onClick={() =>
                    socket.emit("mission:setup", { targetId: mission.targetId, optionIndex: i })
                  }
                >
                  {String.fromCharCode(65 + i)}. {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
