import { connection } from "../net/connection";
import { useNetState } from "../state/useNetState";

export function GameOver() {
  const net = useNetState();
  const room = net.room!;
  const isHost = net.playerId === room.hostId;
  const sorted = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <div className="screen gameover">
      <div className="landing-glow" />
      <h1 className="game-title small">FINAL PLUNDER</h1>
      <div className="card">
        <div className="crew-list">
          {sorted.map((p, i) => (
            <div key={p.id} className={`crew-row ${i === 0 ? "winner-row" : ""}`}>
              <span className="crew-rank">{i + 1}</span>
              <span className="crew-name">
                {p.nickname}
                {p.id === net.playerId ? " (YOU)" : ""}
              </span>
              <span className="crew-score">{p.score}</span>
            </div>
          ))}
        </div>
        {isHost && (
          <button className="btn btn-gold" onClick={() => connection.emit("game:again")}>
            SAIL AGAIN
          </button>
        )}
      </div>
    </div>
  );
}
