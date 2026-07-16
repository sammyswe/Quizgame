import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useState } from "react";
import { useGameStore } from "./store/gameStore";
import { Background } from "./components/Background";
import { isMuted, setMuted } from "./lib/sfx";
import { LandingScreen } from "./screens/LandingScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { RoundIntroScreen } from "./screens/RoundIntroScreen";
import { LeaderboardScreen } from "./screens/LeaderboardScreen";
import { WinnerScreen } from "./screens/WinnerScreen";
import { Hud } from "./components/Hud";
import { ItemDrawer } from "./components/ItemDrawer";
import { ChestModal } from "./components/ChestModal";
import { Toasts } from "./components/Toasts";
import { DebugPanel } from "./components/DebugPanel";

const GameplayShell = lazy(() =>
  import("./screens/GameplayShell").then((module) => ({ default: module.GameplayShell })),
);

export default function App() {
  const game = useGameStore((s) => s.game);
  const roomCode = useGameStore((s) => s.roomCode);

  const inGame =
    game && game.phase !== "lobby" && game.phase !== "setup" && game.phase !== "winner";
  /** Phaser owns question + reveal + the board between them — never remount mid-block. */
  const phaserLive =
    game?.phase === "question" || game?.phase === "reveal" || game?.phase === "leaderboard";
  const isRoundIntro = game?.phase === "round_intro";
  const ownsShellBg =
    !roomCode ||
    !game ||
    game.phase === "lobby" ||
    game.phase === "setup" ||
    isRoundIntro;

  let overlay: React.ReactNode = null;
  let overlayKey = "none";
  if (!roomCode || !game) {
    overlay = <LandingScreen />;
    overlayKey = "landing";
  } else {
    switch (game.phase) {
      case "lobby":
      case "setup":
        overlay = <LobbyScreen />;
        overlayKey = "lobby";
        break;
      case "round_intro":
        overlay = <RoundIntroScreen />;
        overlayKey = `intro-${game.arcade?.roundNumber ?? 0}`;
        break;
      case "question":
      case "reveal":
        overlay = null;
        overlayKey = "phaser-clear";
        break;
      case "leaderboard":
        overlay = <LeaderboardScreen />;
        overlayKey = `board-${game.arcade?.roundNumber ?? 0}`;
        break;
      case "winner":
        overlay = <WinnerScreen />;
        overlayKey = "winner";
        break;
      default:
        overlay = <LandingScreen />;
        overlayKey = "landing";
    }
  }

  return (
    <div className="relative min-h-dvh">
      {!phaserLive && !ownsShellBg && <Background />}

      {/* Stable Phaser host — tree shape never changes while phaserLive. */}
      {phaserLive && (
        <div className="fixed inset-0 z-0">
          <Suspense fallback={<div className="fixed inset-0 bg-[#153b5b]" />}>
            <GameplayShell />
          </Suspense>
        </div>
      )}

      <div className={`relative z-10 min-h-dvh ${phaserLive && !overlay ? "pointer-events-none" : ""}`}>
        {inGame && !phaserLive && !isRoundIntro && <Hud />}
        <AnimatePresence mode="wait">
          {overlay ? (
            <motion.div
              key={overlayKey}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className={`min-h-dvh ${game?.phase === "leaderboard" ? "bg-[#0b2438]/92 backdrop-blur-sm" : ""}`}
            >
              {overlay}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {game && !phaserLive && !isRoundIntro && <ItemDrawer />}
      <ChestModal />
      <Toasts />
      {!phaserLive && <MuteButton />}
      <DebugPanel />
    </div>
  );
}

function MuteButton() {
  const [muted, setMutedState] = useState(isMuted());
  return (
    <button
      onClick={() => {
        setMuted(!muted);
        setMutedState(!muted);
      }}
      className="fixed bottom-20 right-4 z-40 flex min-w-20 items-center justify-center rounded-xl border-2 border-[#b98750]/70 bg-[#102c40]/90 px-3 py-2 text-xs font-black opacity-80 backdrop-blur transition hover:opacity-100"
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
    >
      {muted ? "MUTED" : "SOUND"}
    </button>
  );
}
