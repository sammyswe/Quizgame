import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../store/gameStore";

export function Toasts() {
  const toasts = useGameStore((s) => s.toasts);
  const dismiss = useGameStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            initial={{ y: -24, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -16, opacity: 0, scale: 0.95 }}
            onClick={() => dismiss(t.id)}
            className="pointer-events-auto flex max-w-sm items-center gap-2 rounded-2xl border border-neon-gold/40 bg-deeper/95 px-4 py-2.5 text-left text-sm font-bold shadow-neon-gold backdrop-blur"
          >
            {t.icon && <span className="text-xl">{t.icon}</span>}
            <span>{t.text}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
