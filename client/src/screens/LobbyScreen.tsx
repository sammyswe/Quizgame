import { motion } from "framer-motion";
import { useState } from "react";
import { ARCADE, ARCADE_LENGTHS, type GameLength } from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { Screen, SectionTitle } from "../components/ui";
import { PirateAvatar } from "../components/players/PirateAvatar";
import { sfx } from "../lib/sfx";
import { SHELL } from "../lib/shellAssets";

const LENGTH_ORDER: GameLength[] = ["test"];

/** Lobby + game setup. The host picks the length; the crew gathers. */
export function LobbyScreen() {
  const game = useGameStore((s) => s.game);
  const isHost = useGameStore((s) => s.isHost());
  const playerId = useGameStore((s) => s.playerId);
  const pushToast = useGameStore((s) => s.pushToast);
  const [copied, setCopied] = useState(false);
  if (!game) return null;

  const length = game.config.length;
  const me = game.players.find((player) => player.id === playerId);
  const avatarIndex = me?.avatar.startsWith("pirate-")
    ? Number.parseInt(me.avatar.slice(7), 10)
    : 0;

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
    <div className="relative min-h-dvh w-full">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(8,24,40,0.45), rgba(8,24,40,0.78)), url(${SHELL.bgLobbyHarbour})`,
        }}
        aria-hidden
      />
      <Screen className="relative z-10 gap-4 overflow-y-auto">
        <div className="text-center">
          <p className="text-sm text-[#d7ebf5]/90">Room code</p>
          <motion.button
            onClick={copyLink}
            whileTap={{ scale: 0.96 }}
            className="mx-auto block rounded-2xl border-4 border-[#75451f] bg-[#f0d99e] px-8 py-2 font-display text-4xl tracking-[0.3em] text-[#3b2618] shadow-xl"
            aria-label={`Room code ${game.roomCode}, tap to copy invite link`}
          >
            {game.roomCode}
          </motion.button>
          <button
            type="button"
            onClick={copyLink}
            className="mt-1 text-xs font-bold text-[#bfefff] underline underline-offset-2"
          >
            {copied ? "Copied!" : "Copy invite link"}
          </button>
        </div>

        <div>
          <SectionTitle>Crew ({game.players.length}/8)</SectionTitle>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {game.players.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.5, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 18 }}
                className={`pirate-panel flex items-center gap-2 p-2 ${
                  p.id === playerId ? "ring-2 ring-[#f2c85b]" : ""
                }`}
              >
                <PirateAvatar playerId={p.id} emoji={p.avatar} size={40} bobDelay={i * 0.3} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-black">
                    {p.nickname}{" "}
                    {p.id === playerId && <span className="text-[#ffe18a]">(you)</span>}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">
                    {p.isHost ? "Captain and host" : p.isBot ? "Bot crew" : "Crew"}
                  </div>
                </div>
              </motion.div>
            ))}
            {game.players.length < 2 && (
              <div className="neon-card flex items-center justify-center border-dashed p-3 text-sm text-slate-300">
                Waiting for friends...
              </div>
            )}
          </div>
        </div>

        <div className="pirate-panel p-3">
          <SectionTitle>Hull mark (3 letters)</SectionTitle>
          <input
            className="input mx-auto mt-2 max-w-[8rem] text-center font-display text-2xl uppercase tracking-[0.35em]"
            maxLength={3}
            value={me?.monogram ?? ""}
            onChange={(e) => {
              const next = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 3);
              socket.emit("monogram:set", next || "XXX");
            }}
            aria-label="Three letter ship monogram"
          />
        </div>

        <div className="pirate-panel p-3">
          <SectionTitle>Choose your pirate</SectionTitle>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {Array.from({ length: 8 }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Choose pirate ${index + 1}`}
                onClick={() => socket.emit("avatar:choose", index)}
                className={`rounded-full p-1 transition active:scale-95 ${
                  avatarIndex === index
                    ? "bg-[#f2c85b] ring-4 ring-[#fff0b2]"
                    : "bg-[#14354b]/70"
                }`}
              >
                <PirateAvatar
                  playerId={`choice-${index}`}
                  emoji={`pirate-${index}`}
                  size={48}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Game length</SectionTitle>
          <div className="mt-2 grid max-w-sm grid-cols-1 gap-2">
            {LENGTH_ORDER.map((l) => (
              <button
                key={l}
                disabled={!isHost}
                onClick={() => setLength(l)}
                className={`pirate-panel p-3 text-center transition ${
                  length === l ? "ring-4 ring-[#f2c85b]" : "opacity-70"
                } ${isHost ? "" : "pointer-events-none"}`}
              >
                <div className="font-display text-sm text-[#ffe18a]">
                  {ARCADE_LENGTHS[l].label}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-300">
                  {ARCADE_LENGTHS[l].blurb}
                </div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-300">
            The first item arrives after question {ARCADE.FIRST_ITEM_WINDOW}.
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
            SET SAIL
          </motion.button>
        ) : (
          <p className="animate-shimmer text-center font-display text-lg text-neon-cyan">
            Waiting for the host to start...
          </p>
        )}
        {isHost && game.players.length < 2 && (
          <p className="-mt-2 text-center text-xs text-slate-300">
            Need 2+ players — share the invite link.
          </p>
        )}
      </Screen>
    </div>
  );
}
