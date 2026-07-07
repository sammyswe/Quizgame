import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useGameStore } from "./store/gameStore";
import { Background } from "./components/Background";
import { isMuted, setMuted } from "./lib/sfx";
import { LandingScreen } from "./screens/LandingScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { RoundIntroScreen } from "./screens/RoundIntroScreen";
import { QuestionScreen } from "./screens/QuestionScreen";
import { AuctionScreen } from "./screens/AuctionScreen";
import { PairChoiceScreen } from "./screens/PairChoiceScreen";
import { FinalActionScreen } from "./screens/FinalActionScreen";
import { RevealScreen } from "./screens/RevealScreen";
import { LeaderboardScreen } from "./screens/LeaderboardScreen";
import { WinnerScreen } from "./screens/WinnerScreen";
import { Hud } from "./components/Hud";
import { ItemDrawer } from "./components/ItemDrawer";
import { ChestModal } from "./components/ChestModal";
import { Toasts } from "./components/Toasts";
import { DebugPanel } from "./components/DebugPanel";

export default function App() {
  const game = useGameStore((s) => s.game);
  const roomCode = useGameStore((s) => s.roomCode);

  const inGame =
    game && game.phase !== "lobby" && game.phase !== "setup" && game.phase !== "winner";

  let screen: React.ReactNode;
  let screenKey: string;
  if (!roomCode || !game) {
    screen = <LandingScreen />;
    screenKey = "landing";
  } else {
    switch (game.phase) {
      case "lobby":
      case "setup":
        screen = <LobbyScreen />;
        screenKey = "lobby";
        break;
      case "round_intro":
        screen = <RoundIntroScreen />;
        screenKey = `intro-${game.roundIndex}`;
        break;
      case "auction":
        screen = <AuctionScreen />;
        screenKey = "auction";
        break;
      case "question":
        screen = <QuestionScreen />;
        screenKey = `q-${game.question?.id ?? game.questionNumber}`;
        break;
      case "pair_choice":
        screen = <PairChoiceScreen />;
        screenKey = "pair";
        break;
      case "final_action":
        screen = <FinalActionScreen />;
        screenKey = `final-${game.finalPlunder?.questionNumber ?? 0}`;
        break;
      case "reveal":
        screen = <RevealScreen />;
        screenKey = `reveal-${game.revealEvents[0]?.id ?? game.roundIndex}`;
        break;
      case "leaderboard":
        screen = <LeaderboardScreen />;
        screenKey = `board-${game.roundIndex}`;
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
      <Background />
      <div className="relative z-10 min-h-full">
        {inGame && <Hud />}
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
      {game && <ItemDrawer />}
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
      className="fixed bottom-20 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-base opacity-70 backdrop-blur transition hover:opacity-100"
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
