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
  // Hold one Phaser canvas for the whole block so Q2+ never remounts to a blank blue screen.
  const holdPhaser =
    game?.phase === "question" || game?.phase === "reveal" || game?.phase === "leaderboard";
  const showPhaserCanvas = game?.phase === "question" || game?.phase === "reveal";

  let screen: React.ReactNode;
  let screenKey: string;
  if (!roomCode || !game) {
    screen = <LandingScreen />;
    screenKey = "landing";
  } else if (holdPhaser) {
    screen = (
      <Suspense fallback={<div className="fixed inset-0 bg-[#153b5b]" />}>
        <div className="relative min-h-full">
          <div className={showPhaserCanvas ? "contents" : "invisible pointer-events-none fixed inset-0"}>
            <GameplayShell />
          </div>
          {game.phase === "leaderboard" && (
            <div className="relative z-20 min-h-full">
              <LeaderboardScreen />
            </div>
          )}
        </div>
      </Suspense>
    );
    screenKey = "voyage-runtime";
  } else {
    switch (game.phase) {
      case "lobby":
      case "setup":
        screen = <LobbyScreen />;
        screenKey = "lobby";
        break;
      case "round_intro":
        screen = <RoundIntroScreen />;
        screenKey = `intro-${game.arcade?.roundNumber ?? 0}`;
        break;
      case "winner":
        screen = <WinnerScreen />;
        screenKey = "winner";
        break;
      default:
        screen = <LandingScreen />;
        screenKey = "landing";
    }
  }

  return (
    <div className="relative min-h-full">
      {!showPhaserCanvas && <Background />}
      <div className="relative z-10 min-h-full">
        {inGame && !showPhaserCanvas && <Hud />}
        <AnimatePresence mode="wait">
          <motion.div
            key={screenKey}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="min-h-full"
          >
            {screen}
          </motion.div>
        </AnimatePresence>
      </div>
      {game && !showPhaserCanvas && <ItemDrawer />}
      <ChestModal />
      <Toasts />
      <MuteButton />
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
