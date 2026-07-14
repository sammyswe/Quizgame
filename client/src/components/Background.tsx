import { useMemo } from "react";

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
      <div className="absolute inset-0 bg-gradient-to-b from-[#83d5ea] via-[#3c9bb8] to-[#0c4969]" />
      <div className="absolute left-[8%] top-[10%] h-24 w-24 rounded-full bg-[#fff0b0] shadow-[0_0_80px_rgba(255,238,167,0.8)]" />
      <div className="absolute inset-x-0 top-[44%] h-[34%] bg-gradient-to-b from-[#2b8fac] to-[#0d5576]" />
      <div className="absolute inset-x-0 top-[48%] h-20 opacity-35 [background:repeating-radial-gradient(ellipse_at_center,transparent_0_16px,#b8eff2_18px_20px,transparent_22px_42px)]" />
      <div className="absolute bottom-0 left-[-6%] h-[35%] w-[112%] rotate-[-1deg] border-t-[12px] border-[#5f351f] bg-[repeating-linear-gradient(90deg,#6e3e24_0_70px,#8c5630_72px_136px,#4c2c1d_138px_144px)] shadow-[0_-18px_34px_rgba(4,26,39,0.35)]" />
      <div className="absolute bottom-[31%] left-0 h-5 w-full bg-[#5c321f] shadow-[0_5px_0_#2d1d17]" />
      {[18, 48, 78].map((left, index) => (
        <div key={left} className="absolute bottom-[34%]" style={{ left: `${left}%`, transform: `scale(${0.72 + index * 0.09})` }}>
          <div className="h-16 w-2 bg-[#51301f]" />
          <div className="absolute -left-10 top-1 h-12 w-12 skew-x-[-10deg] rounded-r-full border-2 border-[#5d3a27] bg-[#f2e5c0]" />
          <div className="absolute -left-12 top-12 h-5 w-24 rounded-b-[50%] border-2 border-[#3b2419] bg-[#704127]" />
        </div>
      ))}

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
