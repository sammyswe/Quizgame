import { useMemo } from "react";
import { HF } from "../lib/higgsfield";

/**
 * Full-bleed neon pirate ocean — Higgsfield Loot Drop painting (A1) with a
 * light particle wash on top so the world feels alive without burying UI.
 */
export function Background() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        left: (i * 137.5) % 100,
        size: 3 + ((i * 7) % 9),
        duration: 9 + ((i * 3) % 10),
        delay: (i * 1.7) % 9,
        opacity: 0.05 + ((i * 13) % 10) / 80,
      })),
    [],
  );
  const sparks = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        left: (17 + i * 41.5) % 100,
        top: (11 + i * 29) % 80,
        duration: 5 + (i % 4) * 1.6,
        delay: (i * 0.9) % 5,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Higgsfield painted ocean — the visual anchor of the game */}
      <img
        src={HF.background}
        alt=""
        className="absolute inset-0 h-full w-full scale-105 object-cover"
        style={{
          filter: "saturate(1.08) contrast(1.05)",
          animation: "hf-ocean-drift 28s ease-in-out infinite alternate",
        }}
      />
      {/* Readability veil so neon cards stay crisp over busy art */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 28%, rgba(7,11,30,0.15) 0%, rgba(7,11,30,0.55) 55%, rgba(7,11,30,0.78) 100%)",
        }}
      />
      {/* Soft aurora accents matching the painting's cyan / magenta lights */}
      <div className="aurora aurora-1 opacity-40" />
      <div className="aurora aurora-2 opacity-30" />

      {bubbles.map((b, i) => (
        <span
          key={`b-${i}`}
          className="bubble"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            opacity: b.opacity,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}

      {sparks.map((s, i) => (
        <span
          key={`s-${i}`}
          className="spark"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
