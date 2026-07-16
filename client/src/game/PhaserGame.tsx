import Phaser from "phaser";
import { useEffect, useRef } from "react";
import { ArcadeGameplayScene } from "./scenes/ArcadeGameplayScene";

export function PhaserGame() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = hostRef.current;
    if (!parent) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: 1280,
      height: 720,
      backgroundColor: "#153b5b",
      transparent: false,
      antialias: true,
      roundPixels: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
      },
      render: {
        powerPreference: "high-performance",
      },
      scene: [ArcadeGameplayScene],
    });

    return () => game.destroy(true);
  }, []);

  return (
    <div
      ref={hostRef}
      className="pointer-events-auto absolute inset-0 overflow-hidden"
      aria-label="Treasure Trap game"
    />
  );
}
