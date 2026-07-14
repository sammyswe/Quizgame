import { useNetState } from "./state/useNetState";
import { Landing } from "./ui/Landing";
import { Lobby } from "./ui/Lobby";
import { GameOver } from "./ui/GameOver";
import { DebugPanel } from "./ui/DebugPanel";
import { PhaserGame } from "./game/PhaserGame";

export function App() {
  const net = useNetState();

  if (!net.room) return <Landing />;
  if (net.room.phase === "lobby") return <Lobby />;
  if (net.room.phase === "gameOver") return <GameOver />;

  return (
    <div className="game-shell">
      <PhaserGame />
      <div className="hud-chip">
        <span className="hud-chip-code">{net.room.code}</span>
        <span className={`hud-chip-dot ${net.status === "connected" ? "ok" : "bad"}`} />
      </div>
      <DebugPanel />
    </div>
  );
}
