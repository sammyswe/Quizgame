import { useEffect, useState } from "react";
import { connection } from "../net/connection";
import { gameSettings, type AnimationIntensity, type AssetMode } from "../game/settings";

const showDebug = import.meta.env.DEV || new URLSearchParams(location.search).has("debug");

/**
 * Dev-only visual iteration panel. Toggle with the wrench button or ` key.
 */
export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`") setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    const unsub = gameSettings.subscribe(() => force((n) => n + 1));
    return () => {
      window.removeEventListener("keydown", onKey);
      unsub();
    };
  }, []);

  if (!showDebug) return null;

  return (
    <>
      <button className="debug-toggle" onClick={() => setOpen((o) => !o)} title="Debug (`)">
        🔧
      </button>
      {open && (
        <div className="debug-panel">
          <h3>DEBUG</h3>
          <div className="debug-group">
            <button onClick={() => connection.emit("debug:addBot")}>Add bot (auto-allocates)</button>
            <button onClick={() => connection.emit("debug:skipTimer")}>Skip timer (3s)</button>
            <button onClick={() => connection.emit("debug:forceReveal")}>Force reveal</button>
            <button onClick={() => connection.emit("debug:grantItem")}>Grant Fear Shot</button>
            <button onClick={() => connection.emit("game:again")}>Restart game (host)</button>
          </div>
          <div className="debug-group">
            <label>Animation intensity</label>
            <select
              value={gameSettings.animationIntensity}
              onChange={(e) => gameSettings.set({ animationIntensity: e.target.value as AnimationIntensity })}
            >
              <option value="reduced">reduced</option>
              <option value="normal">normal</option>
              <option value="chaos">chaos</option>
            </select>
            <label>Assets</label>
            <select
              value={gameSettings.assetMode}
              onChange={(e) => gameSettings.set({ assetMode: e.target.value as AssetMode })}
            >
              <option value="auto">auto (Higgsfield if present)</option>
              <option value="procedural">procedural only</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={gameSettings.soundEnabled}
                onChange={(e) => gameSettings.set({ soundEnabled: e.target.checked })}
              />{" "}
              sound blips
            </label>
          </div>
        </div>
      )}
    </>
  );
}
