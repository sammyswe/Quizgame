import { motion } from "framer-motion";
import { EmojiBurst } from "../fx";

/**
 * Cannon impact: expanding orange fireball, drifting smoke puffs, debris burst.
 * Mount with a key to fire once; cleans itself up visually.
 */
export function CannonBlast({ small = false }: { small?: boolean }) {
  const scale = small ? 0.6 : 1;
  const puffs = [
    { x: -40 * scale, y: -20 * scale, delay: 0.1, size: 44 * scale },
    { x: 30 * scale, y: -34 * scale, delay: 0.18, size: 56 * scale },
    { x: 0, y: 16 * scale, delay: 0.26, size: 40 * scale },
  ];
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      aria-hidden
    >
      {/* Fireball */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 30 * scale,
          height: 30 * scale,
          background:
            "radial-gradient(circle, #fff7ed 0%, #fb923c 40%, #ea580c 70%, transparent 75%)",
        }}
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: 5.5, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {/* Shockwave ring */}
      <motion.div
        className="absolute rounded-full border-4 border-orange-300/70"
        style={{ width: 40 * scale, height: 40 * scale }}
        initial={{ scale: 0.4, opacity: 0.9 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />
      {/* Smoke puffs */}
      {puffs.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background:
              "radial-gradient(circle, rgba(148,163,184,0.55), rgba(71,85,105,0.25) 60%, transparent 75%)",
          }}
          initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
          animate={{ x: p.x, y: p.y - 30, scale: 1.6, opacity: [0, 0.8, 0] }}
          transition={{ duration: 1.1, delay: p.delay, ease: "easeOut" }}
        />
      ))}
      <EmojiBurst emoji="💥" count={small ? 4 : 7} distance={small ? 60 : 110} duration={0.7} />
    </div>
  );
}
