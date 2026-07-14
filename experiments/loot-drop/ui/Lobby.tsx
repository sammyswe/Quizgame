import { connection } from "../net/connection";
import { useNetState } from "../state/useNetState";

const AVATAR_COLORS = ["#2ee6ff", "#ff4fd8", "#ffd23e", "#7cff4f", "#ff7a3d", "#a06bff", "#ff4f5e", "#4f8dff"];

export function Lobby() {
  const net = useNetState();
  const room = net.room!;
  const isHost = net.playerId === room.hostId;

  return (
    <div className="screen lobby">
      <div className="landing-glow" />
      <p className="lobby-label">ROOM CODE</p>
      <h1 className="room-code">{room.code}</h1>
      <p className="tagline">Friends join at this address with the code above</p>

      <div className="card">
        <div className="crew-list">
          {room.players.map((p) => (
            <div key={p.id} className="crew-row">
              <span className="crew-dot" style={{ background: AVATAR_COLORS[p.avatarId % 8] }} />
              <span className="crew-name">
                {p.nickname}
                {p.isBot ? " 🤖" : ""}
              </span>
              {p.isHost && <span className="crew-badge">CAPTAIN</span>}
            </div>
          ))}
        </div>

        {isHost ? (
          <button className="btn btn-gold" onClick={() => connection.emit("game:start")}>
            START LOOT DROP
          </button>
        ) : (
          <p className="waiting">Waiting for the captain to set sail...</p>
        )}

        {import.meta.env.DEV && (
          <button className="btn btn-ghost" onClick={() => connection.emit("debug:addBot")}>
            + ADD BOT
          </button>
        )}
      </div>
    </div>
  );
}
