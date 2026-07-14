import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { CHEST_SOURCES, POWERUPS, type OwnedPowerUp, type PowerUpDef } from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { ItemCard } from "./items/ItemCard";
import { ItemUseOverlay } from "./items/ItemUseOverlay";
import { playSound } from "../lib/soundEvents";
import { sfx } from "../lib/sfx";
import { HfSprite } from "./higgsfield/HfSprite";
import { chestFrame } from "../lib/higgsfield";

/**
 * The booty bag: mystery chests to crack open and power-ups to fire.
 * Attacks arm TARGETING MODE — the drawer closes and you tap a pirate's
 * avatar on the question screen to fire at them.
 */
export function ItemDrawer() {
  const [open, setOpen] = useState(false);
  const [useFx, setUseFx] = useState<{ def: PowerUpDef; key: number } | undefined>();
  const priv = useGameStore((s) => s.priv);
  const game = useGameStore((s) => s.game);
  const setTargeting = useGameStore((s) => s.setTargeting);
  const pushToast = useGameStore((s) => s.pushToast);

  if (!priv || !game) return null;
  const count = priv.powerUps.length + priv.chests.length;
  const inQuestion = game.phase === "question";

  const play = (owned: OwnedPowerUp) => {
    const def = POWERUPS[owned.powerUpId];
    if (def.target === "otherPlayer") {
      // Arm targeting mode — pick a pirate avatar on the question screen.
      setTargeting({ uid: owned.uid, powerUpId: owned.powerUpId });
      setOpen(false);
      sfx.select();
      pushToast({ text: `${def.name} armed — choose a pirate ship.` });
      return;
    }
    // Self / all-others fire instantly with a flourish.
    socket.emit("powerup:use", { uid: owned.uid });
    playSound(def.isAttack ? "cannonFire" : "itemReveal");
    setUseFx({ def, key: Date.now() });
    setTimeout(() => setUseFx(undefined), 1700);
    setOpen(false);
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.9 }}
        animate={count > 0 ? { y: [0, -4, 0] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className="fixed bottom-4 right-4 z-40 flex min-h-14 min-w-24 items-center justify-center rounded-2xl border-2 border-[#d1a34f] bg-[#132f43] px-3 font-display text-sm text-[#ffe18a] shadow-xl"
        aria-label={`Open booty bag, ${count} treasures`}
      >
        BOOTY
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-neon-pink font-display text-sm text-pink-950">
            {count}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="max-h-[75vh] w-full overflow-y-auto rounded-t-3xl border-t border-neon-gold/30 bg-deeper p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-2xl text-neon-gold text-outline">Booty Bag</h2>
                <button
                  className="btn-ghost !min-h-0 !px-3 !py-1.5 !text-sm"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {priv.chests.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                      Mystery Chests
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {priv.chests.map((chest) => {
                        const src = CHEST_SOURCES[chest.source];
                        return (
                          <button
                            key={chest.uid}
                            onClick={() => socket.emit("chest:open", chest.uid)}
                            className="neon-card flex flex-col items-center gap-1 border-neon-gold/30 p-3 transition hover:shadow-neon-gold"
                          >
                            <HfSprite frame={chestFrame("common", "closed")} size={54} label="Chest" />
                            <span className="font-display text-sm text-neon-gold">{src.name}</span>
                            <span className="text-[11px] text-slate-400">{src.blurb}</span>
                            <span className="mt-1 rounded-full bg-neon-gold/20 px-2 py-0.5 text-[11px] font-bold text-neon-gold">
                              Tap to open
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {priv.powerUps.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                      Power-ups
                    </h3>
                    <div className="flex flex-col gap-2.5">
                      {priv.powerUps.map((owned) => (
                        <ItemCard
                          key={owned.uid}
                          def={POWERUPS[owned.powerUpId]}
                          compact
                          playDisabled={!inQuestion}
                          onPlay={() => play(owned)}
                        />
                      ))}
                    </div>
                    {!inQuestion && (
                      <p className="mt-2 text-center text-xs text-slate-500">
                        ⛓️ Usable during questions
                      </p>
                    )}
                  </div>
                )}

                {count === 0 && (
                  <p className="py-8 text-center text-slate-400">
                    No treasure yet
                    <br />
                    <span className="text-xs">
                      First item after question 5; more arrive from streaks and marooning.
                    </span>
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {useFx && <ItemUseOverlay key={useFx.key} def={useFx.def} />}
      </AnimatePresence>
    </>
  );
}
