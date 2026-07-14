import { useMemo } from "react";
import { HF } from "../lib/higgsfield";

/**
 * Interim excursion shell. A newly generated daylight deck background replaces
 * this source once Higgsfield authentication is available.
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
          filter: "sepia(0.18) saturate(0.78) hue-rotate(-12deg) brightness(1.12) contrast(0.92)",
          animation: "hf-ocean-drift 28s ease-in-out infinite alternate",
        }}
      />
      {/* Readability veil so neon cards stay crisp over busy art */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(93,169,194,0.18) 0%, rgba(18,67,88,0.42) 55%, rgba(8,32,48,0.78) 100%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-amber-100/10 to-transparent" />

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
