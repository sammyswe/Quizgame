import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { CHEST_SOURCES, ITEMS, RARITY_META, type OwnedItem } from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";

/**
 * The player's booty bag: mystery chests to crack open and items to play.
 * Items that need a target/option walk the player through picking one.
 */
export function ItemDrawer() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<OwnedItem | undefined>();
  const priv = useGameStore((s) => s.priv);
  const game = useGameStore((s) => s.game);
  const playerId = useGameStore((s) => s.playerId);

  if (!priv || !game) return null;
  const count = priv.items.length + priv.chests.length;
  const inQuestion = game.phase === "question";

  const playItem = (item: OwnedItem) => {
    const def = ITEMS[item.itemId];
    if (
      def.target === "otherPlayer" ||
      def.target === "higherRanked" ||
      def.target === "anyPlayer" ||
      def.target === "wrongOption"
    ) {
      setPending(item);
    } else {
      socket.emit("item:use", { uid: item.uid });
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-neon-gold/50 bg-deeper text-2xl shadow-neon-gold"
        aria-label={`Open booty bag, ${count} treasures`}
      >
        🎒
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-neon-pink font-display text-sm text-pink-950">
            {count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setOpen(false);
              setPending(undefined);
            }}
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
                <h2 className="font-display text-2xl text-neon-gold text-outline">Booty Bag 🎒</h2>
                <button
                  className="btn-ghost !min-h-0 !px-3 !py-1.5 !text-sm"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>

              {pending ? (
                <TargetPicker
                  item={pending}
                  onDone={() => {
                    setPending(undefined);
                    setOpen(false);
                  }}
                  onCancel={() => setPending(undefined)}
                />
              ) : (
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
                              <span className="text-3xl animate-floaty" aria-hidden>
                                🎁
                              </span>
                              <span className="font-display text-sm text-neon-gold">
                                {src.name}
                              </span>
                              <span className="text-[11px] text-slate-400">{src.blurb}</span>
                              <span className="mt-1 rounded-full bg-neon-gold/20 px-2 py-0.5 text-[11px] font-bold text-neon-gold">
                                Open the Chest!
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {priv.items.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                        Items
                      </h3>
                      <div className="flex flex-col gap-2">
                        {priv.items.map((item) => {
                          const def = ITEMS[item.itemId];
                          const meta = RARITY_META[def.rarity];
                          return (
                            <div key={item.uid} className="neon-card flex items-center gap-3 p-3">
                              <span className="text-3xl" aria-hidden>
                                {def.icon}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-display">{def.name}</span>
                                  <span
                                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase"
                                    style={{ color: meta.color, border: `1px solid ${meta.color}` }}
                                  >
                                    {meta.label}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400">{def.description}</p>
                              </div>
                              <button
                                className="btn-cyan !min-h-0 !px-3 !py-1.5 !text-sm shrink-0"
                                disabled={!inQuestion}
                                onClick={() => playItem(item)}
                              >
                                Play
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {!inQuestion && (
                        <p className="mt-2 text-center text-xs text-slate-500">
                          Items can be played while a question is live.
                        </p>
                      )}
                    </div>
                  )}

                  {count === 0 && (
                    <p className="py-8 text-center text-slate-400">
                      Empty bag, sad pirate. 🥲
                      <br />
                      Earn chests by losing loot, winning streaks, and scheming.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  function TargetPicker({
    item,
    onDone,
    onCancel,
  }: {
    item: OwnedItem;
    onDone: () => void;
    onCancel: () => void;
  }) {
    const def = ITEMS[item.itemId];
    const g = game;
    if (!g) return null;
    const myRank = g.players.find((p) => p.id === playerId)?.rank ?? 99;

    if (def.target === "wrongOption") {
      const options = g.question?.options ?? [];
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-300">
            {def.icon} <b>{def.name}</b> — choose the answer to booby-trap:
          </p>
          {options.map((opt, i) => (
            <button
              key={i}
              className="btn-ghost justify-start text-left !text-base"
              onClick={() => {
                socket.emit("item:use", { uid: item.uid, optionIndex: i });
                onDone();
              }}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          ))}
          <button className="btn-ghost !text-sm" onClick={onCancel}>
            Cancel
          </button>
        </div>
      );
    }

    const candidates = g.players.filter((p) => {
      if (def.target === "anyPlayer") return true;
      if (p.id === playerId) return false;
      if (def.target === "higherRanked") return p.rank < myRank;
      return true;
    });

    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-slate-300">
          {def.icon} <b>{def.name}</b> — pick your target:
        </p>
        {candidates.length === 0 && (
          <p className="text-sm text-slate-500">No legal targets right now.</p>
        )}
        {candidates.map((p) => (
          <button
            key={p.id}
            className="btn-ghost justify-start !text-base"
            onClick={() => {
              socket.emit("item:use", { uid: item.uid, targetId: p.id });
              onDone();
            }}
          >
            {p.avatar} {p.nickname} {p.id === playerId ? "(you)" : ""} — #{p.rank}
          </button>
        ))}
        <button className="btn-ghost !text-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  }
}
