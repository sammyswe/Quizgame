import { motion } from "framer-motion";
import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { Screen } from "../components/ui";

export function LandingScreen() {
  const [mode, setMode] = useState<"landing" | "create" | "join">("landing");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("room")?.toUpperCase() ?? "";
  });
  const [busy, setBusy] = useState(false);
  const createRoom = useGameStore((s) => s.createRoom);
  const joinRoom = useGameStore((s) => s.joinRoom);
  const joinError = useGameStore((s) => s.joinError);
  const connected = useGameStore((s) => s.connected);

  // Deep link ?room=XXXX jumps straight to join.
  const hasDeepLink = new URLSearchParams(window.location.search).has("room");
  const effectiveMode = mode === "landing" && hasDeepLink ? "join" : mode;

  const submit = async () => {
    if (!nickname.trim()) return;
    setBusy(true);
    if (effectiveMode === "create") {
      await createRoom(nickname.trim());
    } else {
      await joinRoom(code.trim(), nickname.trim());
    }
    setBusy(false);
  };

  return (
    <Screen className="items-center justify-center gap-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3"
      >
        <motion.div
          className="text-7xl"
          animate={{ y: [0, -10, 0], rotate: [0, -3, 3, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          aria-hidden
        >
          🏴‍☠️
        </motion.div>
        <h1 className="font-display text-6xl leading-none text-neon-gold title-glow">
          TREASURE
          <br />
          TRAP
        </h1>
        <p className="max-w-xs text-sm text-slate-300">
          The neon pirate casino party quiz. Answer trivia, bluff with fake maps, betray your
          friends, and become the <span className="font-black text-neon-gold">richest pirate</span>{" "}
          at the table.
        </p>
        <div className="flex gap-1.5 text-xs text-slate-500">
          <span className="rounded-full border border-white/10 px-2 py-0.5">2–8 players</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5">ages 9+</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5">zero mercy</span>
        </div>
      </motion.div>

      {effectiveMode === "landing" ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex w-full max-w-xs flex-col gap-3"
        >
          <button className="btn-gold w-full text-xl" onClick={() => setMode("create")}>
            ⚓ Create a Voyage
          </button>
          <button className="btn-cyan w-full text-xl" onClick={() => setMode("join")}>
            🦜 Join a Crew
          </button>
        </motion.div>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full max-w-xs flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {effectiveMode === "join" && (
            <input
              className="input text-center font-display text-2xl uppercase tracking-[0.4em]"
              placeholder="CODE"
              value={code}
              maxLength={6}
              autoCapitalize="characters"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              aria-label="Room code"
            />
          )}
          <input
            className="input text-center"
            placeholder="Yer pirate name"
            value={nickname}
            maxLength={16}
            autoFocus
            onChange={(e) => setNickname(e.target.value)}
            aria-label="Nickname"
          />
          {joinError && <p className="text-sm font-bold text-neon-red">{joinError}</p>}
          <button
            type="submit"
            className={effectiveMode === "create" ? "btn-gold w-full" : "btn-cyan w-full"}
            disabled={busy || !connected || !nickname.trim() || (effectiveMode === "join" && code.length < 4)}
          >
            {busy ? "Hoisting sails..." : effectiveMode === "create" ? "⚓ Create a Voyage" : "🦜 Join the Crew"}
          </button>
          <button type="button" className="btn-ghost !min-h-0 !py-2 !text-sm" onClick={() => setMode("landing")}>
            ← Back
          </button>
          {!connected && <p className="text-xs text-slate-500">Connecting to the high seas...</p>}
        </motion.form>
      )}
    </Screen>
  );
}
