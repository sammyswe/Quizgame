import { useState } from "react";
import { emitWithAck, socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { useGameFeel, type AnimationIntensity } from "../lib/gameFeel";

/**
 * Dev-only playtest panel (import.meta.env.DEV). Not rendered in production
 * builds; the server also refuses debug events when NODE_ENV=production.
 */
export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [stateJson, setStateJson] = useState<string | undefined>();
  const game = useGameStore((s) => s.game);
  const intensity = useGameFeel((s) => s.intensity);
  const setIntensity = useGameFeel((s) => s.setIntensity);

  if (!import.meta.env.DEV || !game) return null;

  const dump = async () => {
    const state = await emitWithAck<unknown>("debug:getState");
    setStateJson(JSON.stringify(state, null, 2));
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-deeper text-lg opacity-60 hover:opacity-100"
        aria-label="Playtest panel"
      >
        🧪
      </button>
      {open && (
        <div className="fixed bottom-20 left-4 z-40 flex w-64 flex-col gap-1.5 rounded-2xl border border-white/20 bg-deeper/95 p-3 text-xs backdrop-blur">
          <div className="mb-1 font-display text-sm text-neon-green">Playtest Panel</div>
          <DebugButton label="🤖 Add bot player" onClick={() => socket.emit("debug:addBot")} />
          <DebugButton
            label="⏭️ Skip timer / force next"
            onClick={() => socket.emit("debug:skipTimer")}
          />
          <DebugButton
            label="🎁 Force chest (me)"
            onClick={() => socket.emit("debug:forceChest")}
          />
          <DebugButton
            label="🎲 All players answer randomly"
            onClick={() => socket.emit("debug:autoAnswer")}
          />
          <DebugButton label="🔄 Reset game to lobby" onClick={() => socket.emit("debug:reset")} />
          <DebugButton
            label={stateJson ? "🙈 Hide state JSON" : "🔍 Show state JSON"}
            onClick={() => (stateJson ? setStateJson(undefined) : void dump())}
          />
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[10px] text-slate-400">FX:</span>
            {(["reduced", "normal", "chaos"] as AnimationIntensity[]).map((i) => (
              <button
                key={i}
                onClick={() => setIntensity(i)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  intensity === i ? "bg-neon-green/30 text-neon-green" : "bg-white/5 text-slate-400"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-slate-500">
            Phase: {game.phase} · Round: {game.currentRound ?? "-"}
          </div>
        </div>
      )}
      {stateJson && (
        <pre className="fixed inset-x-4 bottom-40 top-16 z-40 overflow-auto rounded-xl border border-white/20 bg-black/90 p-3 text-[10px] text-green-300">
          {stateJson}
        </pre>
      )}
    </>
  );
}

function DebugButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-left font-bold hover:bg-white/10"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
