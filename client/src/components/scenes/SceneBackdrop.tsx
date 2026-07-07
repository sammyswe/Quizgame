import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { RoundId } from "@treasure-trap/shared";
import { ambientAllowed, useGameFeel } from "../../lib/gameFeel";

/**
 * Per-round ambient scene layer. Renders behind the screen content (above the
 * global ocean backdrop) and gives each round its own animated world:
 * islands, casino spotlights, burning maps, fog, caves, storms, vaults.
 * Everything is pointer-events-none and readability-safe.
 */
export function SceneBackdrop({ round }: { round?: RoundId }) {
  const intensity = useGameFeel((s) => s.intensity);
  if (!round || !ambientAllowed(intensity)) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      {round === "lootDrop" && <LootDropScene />}
      {round === "treasureAuction" && <AuctionScene />}
      {round === "falseMap" && <FalseMapScene />}
      {round === "obscureIsland" && <ObscureScene />}
      {round === "splitOrPlunder" && <CaveScene />}
      {round === "captainsChase" && <StormScene />}
      {round === "finalPlunder" && <VaultScene />}
    </div>
  );
}

// ---------------------------------------------------------------------------

/** Cartoon pirate ship silhouette that bobs and sails. */
export function PirateShip({ size = 64, flip = false }: { size?: number; flip?: boolean }) {
  return (
    <svg
      width={size}
      height={size * 0.9}
      viewBox="0 0 100 90"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
    >
      {/* Hull */}
      <path
        d="M10 62 Q50 78 90 62 L82 78 Q50 90 18 78 Z"
        fill="#1e1b4b"
        stroke="#22d3ee"
        strokeWidth="2"
      />
      {/* Mast */}
      <rect x="48" y="14" width="4" height="50" fill="#312e81" stroke="#22d3ee" strokeWidth="1.5" />
      {/* Sail */}
      <path d="M52 18 Q78 32 52 48 Z" fill="#0f172a" stroke="#f472b6" strokeWidth="2" />
      <path d="M48 22 Q28 34 48 44 Z" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
      {/* Flag */}
      <path d="M48 14 L34 10 L48 6 Z" fill="#0b0b14" stroke="#fb7185" strokeWidth="1.5" />
      {/* Skull on sail */}
      <circle cx="60" cy="32" r="4" fill="#fbbf24" />
      <rect x="56.5" y="37" width="7" height="1.6" rx="0.8" fill="#fbbf24" />
    </svg>
  );
}

/** Glowing island hump silhouette. */
function Island({
  left,
  size = 90,
  hue = "#22d3ee",
  delay = 0,
}: {
  left: string;
  size?: number;
  hue?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="absolute bottom-0"
      style={{ left }}
      animate={{ y: [0, -5, 0] }}
      transition={{ repeat: Infinity, duration: 4.5, delay, ease: "easeInOut" }}
    >
      <svg width={size} height={size * 0.55} viewBox="0 0 100 55">
        <ellipse cx="50" cy="52" rx="48" ry="10" fill={`${hue}22`} />
        <path
          d="M8 52 Q30 8 50 20 Q66 4 92 52 Z"
          fill="#0d1233"
          stroke={hue}
          strokeWidth="2"
          opacity="0.85"
        />
        <path d="M46 22 L46 10 L58 15 L46 18 Z" fill="#fbbf24" opacity="0.9" />
      </svg>
      <div
        className="absolute inset-x-0 bottom-1 mx-auto h-3 w-3/4 rounded-full blur-md"
        style={{ backgroundColor: `${hue}55` }}
      />
    </motion.div>
  );
}

function LootDropScene() {
  return (
    <>
      <Island left="4%" size={110} hue="#22d3ee" />
      <Island left="34%" size={80} hue="#fbbf24" delay={1.2} />
      <Island left="62%" size={95} hue="#f472b6" delay={0.6} />
      <Island left="86%" size={70} hue="#4ade80" delay={1.8} />
      {/* Circling ship */}
      <motion.div
        className="absolute bottom-10"
        initial={{ x: "-15vw" }}
        animate={{ x: "110vw" }}
        transition={{ repeat: Infinity, duration: 26, ease: "linear" }}
      >
        <motion.div
          animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <PirateShip size={58} />
        </motion.div>
      </motion.div>
    </>
  );
}

function AuctionScene() {
  return (
    <>
      {/* Casino spotlights sweeping */}
      <motion.div
        className="absolute -top-20 left-1/4 h-[60vh] w-24 origin-top"
        style={{ background: "linear-gradient(to bottom, rgba(251,191,36,0.16), transparent)" }}
        animate={{ rotate: [-18, 14, -18] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -top-20 right-1/4 h-[60vh] w-24 origin-top"
        style={{ background: "linear-gradient(to bottom, rgba(244,114,182,0.14), transparent)" }}
        animate={{ rotate: [16, -12, 16] }}
        transition={{ repeat: Infinity, duration: 8.5, ease: "easeInOut" }}
      />
      {/* Drifting coins */}
      {[12, 38, 66, 84].map((left, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl"
          style={{ left: `${left}%`, top: `${70 + (i % 2) * 10}%` }}
          animate={{ y: [0, -14, 0], rotate: [0, 180, 360], opacity: [0.35, 0.7, 0.35] }}
          transition={{ repeat: Infinity, duration: 5 + i, delay: i * 0.7 }}
        >
          🪙
        </motion.span>
      ))}
      {/* Neon sign glow */}
      <div className="absolute right-6 top-16 rounded-xl border border-neon-gold/40 px-3 py-1 font-display text-sm text-neon-gold/60 shadow-neon-gold">
        BLACK MARKET
      </div>
    </>
  );
}

function FalseMapScene() {
  return (
    <>
      {/* Cursed red vignette */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 110%, rgba(190,18,60,0.22), transparent 60%)",
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 4 }}
      />
      {/* Burning embers rising */}
      {[8, 22, 48, 70, 88].map((left, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full"
          style={{
            left: `${left}%`,
            bottom: -6,
            backgroundColor: i % 2 ? "#fb923c" : "#fb7185",
            boxShadow: "0 0 8px #fb923c",
          }}
          animate={{
            y: [0, -window.innerHeight * 0.5],
            x: [0, i % 2 ? 20 : -16],
            opacity: [0, 0.9, 0],
          }}
          transition={{ repeat: Infinity, duration: 6 + i * 1.2, delay: i * 0.9, ease: "easeOut" }}
        />
      ))}
      {/* Dashed fake route drawing itself */}
      <svg
        className="absolute inset-x-0 top-24 mx-auto w-4/5 opacity-25"
        viewBox="0 0 300 80"
        fill="none"
      >
        <motion.path
          d="M10 60 Q80 10 150 44 Q220 76 290 24"
          stroke="#fb7185"
          strokeWidth="3"
          strokeDasharray="8 8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1, 0] }}
          transition={{ repeat: Infinity, duration: 9, times: [0, 0.4, 0.8, 1] }}
        />
        <circle cx="290" cy="24" r="6" stroke="#fb7185" strokeWidth="2.5" fill="none" />
        <path d="M285 19 L295 29 M295 19 L285 29" stroke="#fb7185" strokeWidth="2.5" />
      </svg>
    </>
  );
}

function ObscureScene() {
  return (
    <>
      {/* Drifting fog banks */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute h-40 w-[60vw] rounded-full blur-3xl"
          style={{
            top: `${20 + i * 22}%`,
            background: "radial-gradient(ellipse, rgba(148,163,184,0.14), transparent 70%)",
          }}
          initial={{ x: i % 2 ? "-30vw" : "90vw" }}
          animate={{ x: i % 2 ? "110vw" : "-50vw" }}
          transition={{ repeat: Infinity, duration: 30 + i * 8, ease: "linear" }}
        />
      ))}
      {/* Mysterious island emerging */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        animate={{ opacity: [0.25, 0.6, 0.25], y: [6, 0, 6] }}
        transition={{ repeat: Infinity, duration: 8 }}
      >
        <Island left="0" size={130} hue="#c084fc" />
      </motion.div>
    </>
  );
}

function CaveScene() {
  return (
    <>
      {/* Stalactites */}
      <svg
        className="absolute inset-x-0 top-0 w-full opacity-50"
        height="70"
        preserveAspectRatio="none"
        viewBox="0 0 400 70"
      >
        <path
          d="M0 0 L400 0 L400 12 L382 44 L370 12 L340 12 L330 58 L318 12 L260 12 L248 38 L238 12 L180 12 L168 52 L158 12 L110 12 L100 34 L90 12 L40 12 L28 46 L18 12 L0 12 Z"
          fill="#0a0e28"
          stroke="#4ade8033"
          strokeWidth="1.5"
        />
      </svg>
      {/* Emerald treasure sparkle */}
      {[18, 42, 58, 80].map((left, i) => (
        <motion.span
          key={i}
          className="absolute text-xl"
          style={{ left: `${left}%`, bottom: `${8 + (i % 2) * 6}%` }}
          animate={{ opacity: [0.15, 0.9, 0.15], scale: [0.8, 1.25, 0.8] }}
          transition={{ repeat: Infinity, duration: 2.4 + i * 0.5, delay: i * 0.6 }}
        >
          {i % 2 ? "💎" : "🪙"}
        </motion.span>
      ))}
      {/* Cave glow */}
      <div
        className="absolute bottom-0 left-1/2 h-40 w-[70vw] -translate-x-1/2 blur-3xl"
        style={{ background: "radial-gradient(ellipse, rgba(74,222,128,0.12), transparent 70%)" }}
      />
    </>
  );
}

function StormScene() {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    let alive = true;
    const loop = () => {
      if (!alive) return;
      setTimeout(
        () => {
          if (!alive) return;
          setFlash(true);
          setTimeout(() => setFlash(false), 180);
          loop();
        },
        4000 + Math.random() * 6000,
      );
    };
    loop();
    return () => {
      alive = false;
    };
  }, []);
  return (
    <>
      {/* Storm vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(15,23,42,0.5), transparent 55%)",
        }}
      />
      {/* Lightning */}
      {flash && <div className="absolute inset-0 bg-cyan-100/20" />}
      {/* Racing ships */}
      <motion.div
        className="absolute bottom-6 left-[8%]"
        animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
        transition={{ repeat: Infinity, duration: 2.2 }}
      >
        <PirateShip size={52} />
      </motion.div>
      <motion.div
        className="absolute bottom-8 right-[10%]"
        animate={{ y: [0, -10, 0], rotate: [3, -3, 3] }}
        transition={{ repeat: Infinity, duration: 2.6, delay: 0.6 }}
      >
        <PirateShip size={44} flip />
      </motion.div>
      {/* Fast waves */}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 h-10 w-[200%]"
          style={{
            background: `repeating-linear-gradient(90deg, transparent 0 40px, rgba(34,211,238,${0.05 + i * 0.04}) 40px 80px)`,
          }}
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 3.5 - i, ease: "linear" }}
        />
      ))}
    </>
  );
}

function VaultScene() {
  const skulls = useMemo(() => [15, 50, 85], []);
  return (
    <>
      {/* Doom pulse */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(190,18,60,0.25), transparent 55%)",
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2.6 }}
      />
      {/* Vault bars */}
      <div className="absolute inset-x-0 top-0 flex justify-around opacity-15">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="h-24 w-1.5 rounded-b bg-gradient-to-b from-amber-300 to-transparent"
          />
        ))}
      </div>
      {/* Watching skulls */}
      {skulls.map((left, i) => (
        <motion.span
          key={i}
          className="absolute text-3xl"
          style={{ left: `${left}%`, top: `${12 + i * 4}%` }}
          animate={{ opacity: [0.1, 0.45, 0.1], scale: [0.9, 1.1, 0.9] }}
          transition={{ repeat: Infinity, duration: 3 + i, delay: i * 0.8 }}
        >
          ☠️
        </motion.span>
      ))}
      {/* Gold hoard glow */}
      <div
        className="absolute bottom-0 left-1/2 h-32 w-[80vw] -translate-x-1/2 blur-3xl"
        style={{ background: "radial-gradient(ellipse, rgba(251,191,36,0.16), transparent 70%)" }}
      />
    </>
  );
}
