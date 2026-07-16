import { useMemo } from "react";

/**
 * Living excursion shell behind non-Phaser screens — drifting clouds, rolling
 * water sheen, floating sun, and soft deck motion.
 */
export function Background() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        left: (i * 137.5) % 100,
        size: 3 + ((i * 7) % 9),
        duration: 9 + ((i * 3) % 10),
        delay: (i * 1.7) % 9,
        opacity: 0.06 + ((i * 13) % 10) / 80,
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
  const clouds = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        top: 6 + i * 9,
        width: 140 + i * 48,
        height: 36 + (i % 2) * 12,
        duration: 38 + i * 10,
        delay: i * -8,
        opacity: 0.12 + i * 0.03,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-[#83d5ea] via-[#3c9bb8] to-[#0c4969]" />

      <div
        className="absolute left-[8%] top-[10%] h-24 w-24 rounded-full bg-[#fff0b0] shadow-[0_0_80px_rgba(255,238,167,0.8)]"
        style={{ animation: "sunPulse 6s ease-in-out infinite" }}
      />

      {clouds.map((c, i) => (
        <div
          key={`cloud-${i}`}
          className="absolute rounded-[999px] bg-white blur-[1px]"
          style={{
            top: `${c.top}%`,
            width: c.width,
            height: c.height,
            opacity: c.opacity,
            left: "-20%",
            animation: `cloudDrift ${c.duration}s linear infinite`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}

      <div className="absolute inset-x-0 top-[44%] h-[34%] bg-gradient-to-b from-[#2b8fac] to-[#0d5576]" />
      <div
        className="absolute inset-x-0 top-[48%] h-28 opacity-40"
        style={{
          background:
            "repeating-radial-gradient(ellipse at center, transparent 0 16px, #b8eff2 18px 20px, transparent 22px 42px)",
          animation: "seaSheen 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-x-[-8%] top-[52%] h-16 opacity-25"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(214,248,255,0.55), transparent)",
          animation: "waveRoll 7s ease-in-out infinite",
        }}
      />

      <div
        className="absolute bottom-0 left-[-6%] h-[35%] w-[112%] rotate-[-1deg] border-t-[12px] border-[#5f351f] bg-[repeating-linear-gradient(90deg,#6e3e24_0_70px,#8c5630_72px_136px,#4c2c1d_138px_144px)] shadow-[0_-18px_34px_rgba(4,26,39,0.35)]"
        style={{ animation: "deckBob 5.5s ease-in-out infinite" }}
      />
      <div className="absolute bottom-[31%] left-0 h-5 w-full bg-[#5c321f] shadow-[0_5px_0_#2d1d17]" />
      {[18, 48, 78].map((left, index) => (
        <div
          key={left}
          className="absolute bottom-[34%]"
          style={{
            left: `${left}%`,
            transform: `scale(${0.72 + index * 0.09})`,
            animation: `heroBob ${3.6 + index * 0.4}s ease-in-out infinite`,
            animationDelay: `${index * 0.35}s`,
          }}
        >
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
