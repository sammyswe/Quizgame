import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SPECIAL_EVENTS } from "@treasure-trap/shared";
import { useGameStore } from "../store/gameStore";
import { TimerBar } from "../components/ui";
import { sfx } from "../lib/sfx";
import { socket } from "../net/socket";
import introSevenSeasUrl from "../assets/higgsfield/intro/entering-seven-seas.mp4";
import introPosterUrl from "../assets/higgsfield/intro/entering-seven-seas-poster.webp";

/**
 * Voyage / special-event intro. Seven Seas: full-bleed cinematic, minimal copy.
 */
export function RoundIntroScreen() {
  const game = useGameStore((s) => s.game);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    sfx.drum();
    const t = setTimeout(() => sfx.sting(), 450);
    return () => clearTimeout(t);
  }, [game?.arcade?.roundNumber]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    const play = el.play();
    if (play) void play.catch(() => setVideoFailed(true));
  }, [game?.arcade?.roundNumber]);

  if (!game?.arcade) return null;
  const arcade = game.arcade;
  const isEvent = arcade.isEventRound;
  const meta = isEvent ? SPECIAL_EVENTS[arcade.eventId ?? "millionPoundDrop"] : undefined;

  const title = meta?.name ?? "ENTERING THE SEVEN SEAS";
  const cta = isEvent ? "CONTINUE" : "PLUNDER YER LOOT!";

  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      {!isEvent && !videoFailed && (
        <video
          ref={videoRef}
          className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-700 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          src={introSevenSeasUrl}
          muted
          playsInline
          preload="auto"
          onLoadedData={() => setVideoReady(true)}
          onEnded={() => {
            /* one-shot: hold final frame */
          }}
          onError={() => setVideoFailed(true)}
          aria-hidden
        />
      )}

      {(isEvent || videoFailed || !videoReady) && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: isEvent
              ? "linear-gradient(180deg, #57c4e8 0%, #2a8fb5 45%, #0d4a68 100%)"
              : `linear-gradient(180deg, rgba(8,30,48,0.15), rgba(8,30,48,0.45)), url(${introPosterUrl})`,
          }}
          aria-hidden
        />
      )}

      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/25 via-transparent to-black/55"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-end gap-4 px-6 pb-10 pt-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 28, scale: 1.08 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: isEvent ? 0.1 : 2.2, type: "spring", stiffness: 180, damping: 16 }}
          className="font-display text-5xl leading-none text-[#ffe7a0] title-glow sm:text-6xl md:text-7xl"
        >
          {title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isEvent ? 0.25 : 3.4 }}
          className="flex w-full max-w-sm flex-col items-center gap-3"
        >
          <div className="w-full max-w-xs">
            <TimerBar endsAt={game.timerEndsAt} />
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            className="btn-gold min-w-64 text-xl tracking-wide"
            onClick={() => socket.emit("phase:advance")}
          >
            {cta}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
