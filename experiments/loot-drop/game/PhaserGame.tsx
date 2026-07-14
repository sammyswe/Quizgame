import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createGameConfig } from "./createGameConfig";

/**
 * React wrapper that mounts the Phaser game. All gameplay state flows through
 * GameEventBridge; this component only owns the canvas lifecycle.
 */
export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = new Phaser.Game(createGameConfig(containerRef.current));
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="phaser-container" />;
}
