import { motion } from "framer-motion";
import { useState } from "react";
import {
  GAME_LENGTHS,
  ROUNDS,
  ROUND_ORDER,
  type GameLength,
  type RoundId,
} from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { Screen, SectionTitle } from "../components/ui";

/** Lobby + game setup. The host configures the voyage; the crew watches it build. */
export function LobbyScreen() {
  const game = useGameStore((s) => s.game);
  const isHost = useGameStore((s) => s.isHost());
  const playerId = useGameStore((s) => s.playerId);
  const pushToast = useGameStore((s) => s.pushToast);
  const [copied, setCopied] = useState(false);
  if (!game) return null;

  const length = game.config.length;
  const pickedRounds = game.config.rounds;
  const roundCount = GAME_LENGTHS[length].roundCount;

  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${game.roomCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      pushToast({ icon: "📋", text: shareUrl });
    }
  };

  const setLength = (l: GameLength) => {
    socket.emit("game:configure", { length: l, rounds: [] });
  };

  const toggleRound = (r: RoundId) => {
    if (length === "full") return;
    let next: RoundId[];
    if (pickedRounds.includes(r)) {
      next = pickedRounds.filter((x) => x !== r);
    } else if (pickedRounds.length < roundCount) {
      next = [...pickedRounds, r];
    } else {
      return;
    }
    socket.emit("game:configure", { length, rounds: next });
  };

  const randomise = () => {
    socket.emit("game:configure", { length, rounds: [] });
    pushToast({ icon: "🎲", text: "Rounds will be randomised. Fate decides!" });
  };

  return (
    <Screen className="gap-5">
      <div className="text-center">
        <p className="text-sm text-slate-400">Voyage code</p>
        <motion.button
          onClick={copyLink}
          whileTap={{ scale: 0.96 }}
          className="mx-auto mt-1 block rounded-2xl border border-neon-gold/50 bg-card px-8 py-3 font-display text-5xl tracking-[0.3em] text-neon-gold shadow-neon-gold"
          aria-label={`Room code ${game.roomCode}, tap to copy invite link`}
        >
          {game.roomCode}
        </motion.button>
        <button
          onClick={copyLink}
          className="mt-2 text-xs text-neon-cyan underline underline-offset-2"
        >
          {copied ? "✅ Link copied — send it to yer crew!" : "📋 Copy invite link"}
        </button>
      </div>

      <div>
        <SectionTitle>Crew ({game.players.length}/8)</SectionTitle>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {game.players.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`neon-card flex items-center gap-2 p-3 ${p.id === playerId ? "border-neon-cyan/50 shadow-neon-cyan" : ""}`}
            >
              <span className="text-2xl" aria-hidden>
                {p.avatar}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-black">
                  {p.nickname} {p.id === playerId && <span className="text-neon-cyan">(you)</span>}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">
                  {p.isHost ? "👑 Captain (host)" : p.isBot ? "🤖 Bot" : "Crew"}
                </div>
              </div>
            </motion.div>
          ))}
          {game.players.length < 2 && (
            <div className="neon-card flex items-center justify-center border-dashed p-3 text-sm text-slate-500">
              Waiting for pirates...
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionTitle>Voyage length</SectionTitle>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(Object.keys(GAME_LENGTHS) as GameLength[]).map((l) => (
            <button
              key={l}
              disabled={!isHost}
              onClick={() => setLength(l)}
              className={`neon-card p-3 text-center transition ${
                length === l ? "border-neon-gold/70 shadow-neon-gold" : "opacity-60"
              } ${isHost ? "" : "pointer-events-none"}`}
            >
              <div className="font-display text-sm text-neon-gold">{GAME_LENGTHS[l].label}</div>
              <div className="mt-0.5 text-[10px] text-slate-400">{GAME_LENGTHS[l].blurb}</div>
            </button>
          ))}
        </div>
      </div>

      {length !== "full" && (
        <div>
          <div className="flex items-center justify-between">
            <SectionTitle>
              Rounds (
              {pickedRounds.length === 0 ? "random" : `${pickedRounds.length}/${roundCount}`})
            </SectionTitle>
            {isHost && (
              <button className="btn-ghost !min-h-0 !px-3 !py-1 !text-xs" onClick={randomise}>
                🎲 Randomise
              </button>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {ROUND_ORDER.map((r) => {
              const meta = ROUNDS[r];
              const picked = pickedRounds.includes(r);
              return (
                <button
                  key={r}
                  disabled={!isHost}
                  onClick={() => toggleRound(r)}
                  className={`neon-card flex items-center gap-2 p-2.5 text-left transition ${
                    picked
                      ? "border-neon-cyan/70 shadow-neon-cyan"
                      : pickedRounds.length > 0
                        ? "opacity-50"
                        : ""
                  } ${isHost ? "" : "pointer-events-none"}`}
                >
                  <span className="text-xl" aria-hidden>
                    {meta.icon}
                  </span>
                  <span className="text-xs font-bold">{meta.name}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Leave empty to let fate pick. Final Plunder always closes the show.
          </p>
        </div>
      )}

      {isHost ? (
        <button
          className="btn-gold w-full text-2xl"
          disabled={game.players.length < 2}
          onClick={() => socket.emit("game:start")}
        >
          ⚔️ Set Sail!
        </button>
      ) : (
        <p className="animate-shimmer text-center font-display text-lg text-neon-cyan">
          Waiting for the captain to set sail...
        </p>
      )}
      {isHost && game.players.length < 2 && (
        <p className="-mt-3 text-center text-xs text-slate-500">
          You need at least 2 pirates. Share the link — or summon a bot from the 🧪 panel.
        </p>
      )}
    </Screen>
  );
}
