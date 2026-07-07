import { useMemo } from "react";

/**
 * Animated neon ocean backdrop rendered behind every screen:
 * drifting aurora glows, rising bubbles, floating gold sparks, and a
 * slow-rolling wave silhouette at the bottom. Pure CSS animations — cheap,
 * and disabled automatically by prefers-reduced-motion.
 */
export function Background() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: (i * 137.5) % 100,
        size: 3 + ((i * 7) % 9),
        duration: 9 + ((i * 3) % 10),
        delay: (i * 1.7) % 9,
        opacity: 0.06 + ((i * 13) % 10) / 60,
      })),
    [],
  );
  const sparks = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        left: (17 + i * 41.5) % 100,
        top: (11 + i * 29) % 80,
        duration: 5 + (i % 4) * 1.6,
        delay: (i * 0.9) % 5,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Drifting aurora glows */}
      <div className="aurora aurora-1" />
      <div className="aurora aurora-2" />
      <div className="aurora aurora-3" />

      {/* Rising bubbles */}
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

      {/* Floating gold sparks */}
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

      {/* Rolling wave silhouettes at the bottom */}
      <svg className="wave wave-back" viewBox="0 0 2880 120" preserveAspectRatio="none">
        <path
          d="M0,64 C240,96 480,32 720,56 C960,80 1200,112 1440,88 C1680,64 1920,24 2160,48 C2400,72 2640,104 2880,72 L2880,120 L0,120 Z"
          fill="rgba(34,211,238,0.06)"
        />
      </svg>
      <svg className="wave wave-front" viewBox="0 0 2880 120" preserveAspectRatio="none">
        <path
          d="M0,80 C240,48 480,96 720,72 C960,48 1200,24 1440,56 C1680,88 1920,104 2160,72 C2400,40 2640,64 2880,88 L2880,120 L0,120 Z"
          fill="rgba(192,132,252,0.08)"
        />
      </svg>
    </div>
  );
}
