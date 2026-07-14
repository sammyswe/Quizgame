import { useState } from "react";
import { connection } from "../net/connection";
import { useNetState } from "../state/useNetState";

export function Landing() {
  const net = useNetState();
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    await connection.createRoom(nickname);
    setBusy(false);
  };

  const join = async () => {
    if (code.trim().length < 4) return;
    setBusy(true);
    await connection.joinRoom(code, nickname);
    setBusy(false);
  };

  return (
    <div className="screen landing">
      <div className="landing-glow" />
      <h1 className="game-title">
        TREASURE <span>TRAP</span>
      </h1>
      <p className="tagline">The neon pirate casino party game</p>

      <div className="card">
        <label className="field-label">PIRATE NAME</label>
        <input
          className="field"
          maxLength={16}
          placeholder="e.g. Salty Sam"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <button className="btn btn-gold" disabled={busy} onClick={create}>
          CREATE ROOM
        </button>

        <div className="divider">
          <span>or join a crew</span>
        </div>

        <div className="join-row">
          <input
            className="field field-code"
            maxLength={4}
            placeholder="CODE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button className="btn btn-cyan" disabled={busy || code.trim().length < 4} onClick={join}>
            JOIN
          </button>
        </div>

        {net.error && <p className="error">{net.error}</p>}
      </div>
    </div>
  );
}
