import { motion } from "framer-motion";
import { useState } from "react";
import { ARCADE, ARCADE_LENGTHS, type GameLength } from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { Screen, SectionTitle } from "../components/ui";
import { PirateAvatar } from "../components/players/PirateAvatar";
import { sfx } from "../lib/sfx";

const LENGTH_ORDER: GameLength[] = ["test", "short", "medium", "long"];

/** Lobby + game setup. The host picks the length; the crew gathers. */
export function LobbyScreen() {
  const game = useGameStore((s) => s.game);
  const isHost = useGameStore((s) => s.isHost());
  const playerId = useGameStore((s) => s.playerId);
  const pushToast = useGameStore((s) => s.pushToast);
  const [copied, setCopied] = useState(false);
  if (!game) return null;

  const length = game.config.length;

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

  return (
    <Screen className="gap-5">
      <div className="text-center">
        <p className="text-sm text-slate-400">Room code</p>
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
          {copied ? "✅ Copied!" : "📋 Copy invite link"}
        </button>
      </div>

      <div>
        <SectionTitle>Crew ({game.players.length}/8)</SectionTitle>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {game.players.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.5, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 18 }}
              className={`neon-card flex items-center gap-2 p-3 ${p.id === playerId ? "border-neon-cyan/50 shadow-neon-cyan" : ""}`}
            >
              <PirateAvatar playerId={p.id} emoji={p.avatar} size={40} bobDelay={i * 0.3} />
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
              Waiting for friends...
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionTitle>Game length</SectionTitle>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {LENGTH_ORDER.map((l) => (
            <button
              key={l}
              disabled={!isHost}
              onClick={() => setLength(l)}
              className={`neon-card p-3 text-center transition ${
                length === l ? "border-neon-gold/70 shadow-neon-gold" : "opacity-60"
              } ${isHost ? "" : "pointer-events-none"}`}
            >
              <div className="font-display text-sm text-neon-gold">{ARCADE_LENGTHS[l].label}</div>
              <div className="mt-0.5 text-[10px] text-slate-400">{ARCADE_LENGTHS[l].blurb}</div>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          ⚡ Special event every {ARCADE.EVENT_EVERY}th round · 🎁 answer right in the first{" "}
          {ARCADE.FIRST_ITEM_WINDOW} rounds for an item
        </p>
      </div>

      {isHost ? (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.94 }}
          className="btn-gold w-full text-2xl"
          disabled={game.players.length < 2}
          onClick={() => {
            sfx.drum();
            socket.emit("game:start");
          }}
        >
          ⚔️ Start Game
        </motion.button>
      ) : (
        <p className="animate-shimmer text-center font-display text-lg text-neon-cyan">
          Waiting for the host to start...
        </p>
      )}
      {isHost && game.players.length < 2 && (
        <p className="-mt-3 text-center text-xs text-slate-500">
          Need 2+ players — share the invite link.
        </p>
      )}
    </Screen>
  );
}
