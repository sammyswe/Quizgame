import { useEffect } from "react";
import { socket } from "../net/socket";
import { gameEventBridge, type GameIntent } from "../game/GameEventBridge";
import { PhaserGame } from "../game/PhaserGame";
import { useGameStore } from "../store/gameStore";

export function GameplayShell() {
  useEffect(() => {
    const sync = () => {
      const state = useGameStore.getState();
      gameEventBridge.push({
        game: state.game,
        priv: state.priv,
        playerId: state.playerId,
        result: state.lastResult,
        targeting: state.targeting,
        fired: state.firedFx,
      });
    };
    sync();
    const unsubscribeStore = useGameStore.subscribe(sync);
    const unsubscribeIntents = gameEventBridge.setIntentHandler(handleIntent);
    return () => {
      unsubscribeStore();
      unsubscribeIntents();
    };
  }, []);

  return (
    <main className="fixed inset-0 bg-[#153b5b]">
      <PhaserGame />
    </main>
  );
}

function handleIntent(intent: GameIntent): void {
  switch (intent.type) {
    case "answer":
      socket.emit("answer:submit", { choiceIndex: intent.choiceIndex });
      break;
    case "loot":
      socket.emit("answer:submit", { lootAllocation: intent.allocation });
      break;
    case "mutiny":
      socket.emit("mutiny:declare");
      break;
    case "powerup":
      socket.emit("powerup:use", { uid: intent.uid, targetId: intent.targetId });
      break;
    case "chest":
      socket.emit("chest:open", intent.uid);
      break;
    case "advance":
      socket.emit("phase:advance");
      break;
    case "clearTargeting":
      useGameStore.getState().setTargeting(undefined);
      break;
  }
}
