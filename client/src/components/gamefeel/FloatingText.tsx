import { motion } from "framer-motion";

/**
 * Generic floating text that rises and fades from wherever it's mounted
 * (parent must be positioned). Used for +points, item names, taunts.
 */
export function FloatingText({
  text,
  color = "#4ade80",
  size = "text-2xl",
}: {
  text: string;
  color?: string;
  size?: string;
}) {
  return (
    <motion.div
      className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center font-display ${size}`}
      style={{ color }}
      initial={{ y: 6, opacity: 0, scale: 0.6 }}
      animate={{ y: -46, opacity: [0, 1, 1, 0], scale: [0.6, 1.2, 1, 1] }}
      transition={{ duration: 1.1, ease: "easeOut" }}
      aria-hidden
    >
      <span className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">{text}</span>
    </motion.div>
  );
}
