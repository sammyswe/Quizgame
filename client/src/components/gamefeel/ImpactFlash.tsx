import { motion } from "framer-motion";

/**
 * Full-screen colour flash for impacts — cannon hits, curses, big steals.
 * Mount with a key to retrigger; it fades itself out.
 */
export function ImpactFlash({
  color = "#ffffff",
  opacity = 0.35,
}: {
  color?: string;
  opacity?: number;
}) {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[45]"
      style={{ backgroundColor: color }}
      initial={{ opacity }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      aria-hidden
    />
  );
}
