import { motion } from "framer-motion";
import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { Screen } from "../components/ui";
import { sfx } from "../lib/sfx";

/** Title letters drop in one by one with a spring, then idle-wave forever. */
function BouncyWord({ word, delayOffset = 0 }: { word: string; delayOffset?: number }) {
  return (
    <span aria-hidden>
      {word.split("").map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: -60, opacity: 0, rotate: -12 }}
          animate={{ y: [0, -4, 0], opacity: 1, rotate: 0 }}
          transition={{
            y: {
              delay: delayOffset + i * 0.06 + 1,
              repeat: Infinity,
              repeatDelay: 2.4,
              duration: 0.5,
            },
            opacity: { delay: delayOffset + i * 0.06, type: "spring", stiffness: 300, damping: 14 },
            rotate: { delay: delayOffset + i * 0.06, type: "spring", stiffness: 300, damping: 14 },
          }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

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
          className="text-7xl drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]"
          animate={{ y: [0, -10, 0], rotate: [0, -4, 4, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          aria-hidden
        >
          🏴‍☠️
        </motion.div>
        <h1
          className="font-display text-6xl leading-none text-neon-gold title-glow"
          aria-label="Treasure Trap"
        >
          <BouncyWord word="TREASURE" />
          <br />
          <BouncyWord word="TRAP" delayOffset={0.45} />
        </h1>
        <p className="max-w-xs text-sm text-slate-300">
          Answer trivia. Betray your friends. Get{" "}
          <span className="font-black text-neon-gold">rich</span>.
        </p>
        <div className="flex gap-1.5 text-xs text-slate-500">
          <span className="rounded-full border border-white/10 px-2 py-0.5">2–8 players</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5">~20 min</span>
        </div>
      </motion.div>

      {effectiveMode === "landing" ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex w-full max-w-xs flex-col gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.04, rotate: -0.5 }}
            whileTap={{ scale: 0.94 }}
            className="btn-gold w-full text-xl"
            onClick={() => {
              sfx.select();
              setMode("create");
            }}
          >
            ⚓ Start a Game
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, rotate: 0.5 }}
            whileTap={{ scale: 0.94 }}
            className="btn-cyan w-full text-xl"
            onClick={() => {
              sfx.select();
              setMode("join");
            }}
          >
            🦜 Join with a Code
          </motion.button>
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
            placeholder="Your name"
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
            disabled={
              busy ||
              !connected ||
              !nickname.trim() ||
              (effectiveMode === "join" && code.length < 4)
            }
          >
            {busy ? "Loading..." : effectiveMode === "create" ? "⚓ Start" : "🦜 Join"}
          </button>
          <button
            type="button"
            className="btn-ghost !min-h-0 !py-2 !text-sm"
            onClick={() => setMode("landing")}
          >
            ← Back
          </button>
          {!connected && <p className="text-xs text-slate-500">Connecting...</p>}
        </motion.form>
      )}
    </Screen>
  );
}
