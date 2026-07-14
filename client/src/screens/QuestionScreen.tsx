import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ARCADE, POWERUPS, SPECIAL_EVENTS, potAt } from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { Screen, TimerBar } from "../components/ui";
import { EmojiBurst, LockStamp, Shaker } from "../components/fx";
import { CannonBlast } from "../components/effects/CannonBlast";
import { PirateAvatar } from "../components/players/PirateAvatar";
import { HfSprite } from "../components/higgsfield/HfSprite";
import { islandFrame } from "../lib/higgsfield";
import { sfx } from "../lib/sfx";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuestionScreen() {
  const game = useGameStore((s) => s.game);
  const me = useGameStore((s) => s.me());
  if (!game?.question || !game.arcade || !me) return null;
  const arcade = game.arcade;

  if (me.marooned) return <MaroonedScreen />;

  return (
    <Screen className="gap-3">
      <RoundHeader />
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <TimerBar endsAt={game.timerEndsAt} />
        </div>
        {!arcade.isEventRound && <DecayingPot />}
      </div>

      <PlankBanner />
      <HorizonBanner />

      <motion.h1
        key={game.question.id}
        initial={{ opacity: 0, y: -30, scale: 0.9, rotate: -1.5 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="neon-card border-2 border-neon-gold/30 px-4 py-4 text-center font-display text-2xl leading-snug text-outline shadow-neon-gold"
      >
        {game.question.prompt}
      </motion.h1>

      {arcade.isEventRound ? <TrapdoorAllocator /> : <ChoiceGrid />}

      <PlayerTargetRow />
      {!arcade.isEventRound && <MutinyPanel />}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Header: round progress + first-5 jackpot pips
// ---------------------------------------------------------------------------

function RoundHeader() {
  const game = useGameStore((s) => s.game);
  const playerId = useGameStore((s) => s.playerId);
  const arcade = game?.arcade;
  if (!game || !arcade) return null;
  const inFirstFive = arcade.roundNumber <= ARCADE.FIRST_ITEM_WINDOW;
  const iEarned = playerId ? arcade.firstFiveEarned.includes(playerId) : false;

  return (
    <div className="flex items-center justify-between text-xs text-slate-400">
      <span className="font-bold uppercase tracking-wider">
        Round {arcade.roundNumber}
        <span className="text-slate-600"> / {arcade.totalRounds}</span>
        {arcade.isEventRound && (
          <span className="ml-1.5 rounded-full bg-neon-gold/20 px-2 py-0.5 text-neon-gold">
            ⚡ {SPECIAL_EVENTS[arcade.eventId ?? "millionPoundDrop"].name}
          </span>
        )}
      </span>
      {inFirstFive && !arcade.isEventRound && (
        <span
          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 ${
            iEarned ? "border-neon-green/50 text-neon-green" : "border-neon-gold/40 text-neon-gold"
          }`}
          title="Everyone receives their first item after question 5"
        >
          {iEarned ? "🎁 item aboard!" : "🎁 after Q5"}
          <span className="flex gap-0.5" aria-hidden>
            {Array.from({ length: ARCADE.FIRST_ITEM_WINDOW }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i + 1 < arcade.roundNumber
                    ? "bg-slate-600"
                    : i + 1 === arcade.roundNumber
                      ? "bg-neon-gold"
                      : "bg-white/20"
                }`}
              />
            ))}
          </span>
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The decaying pot — answer fast, earn more
// ---------------------------------------------------------------------------

function DecayingPot() {
  const game = useGameStore((s) => s.game);
  const me = useGameStore((s) => s.me());
  const [pot, setPot] = useState<number>(ARCADE.POT_MAX);
  const arcade = game?.arcade;
  const locked = Boolean(me?.hasAnswered);

  useEffect(() => {
    if (!arcade || locked) return;
    const tick = () => {
      setPot(potAt(Date.now(), arcade.questionStartedAt, arcade.questionDurationMs));
    };
    tick();
    const iv = setInterval(tick, 250);
    return () => clearInterval(iv);
  }, [arcade?.questionStartedAt, arcade?.questionDurationMs, locked]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!arcade) return null;
  const pct = (pot - arcade.potMin) / Math.max(1, arcade.potMax - arcade.potMin);
  const color = locked
    ? "text-neon-cyan border-neon-cyan/60"
    : pct > 0.6
      ? "text-neon-gold border-neon-gold/60"
      : pct > 0.3
        ? "text-amber-500 border-amber-500/60"
        : "text-neon-red border-neon-red/60 animate-pulse";

  return (
    <motion.div
      key={pot}
      initial={{ scale: 1.12 }}
      animate={{ scale: 1 }}
      className={`flex min-w-[76px] flex-col items-center rounded-2xl border-2 bg-black/40 px-3 py-1 ${color}`}
      aria-label={locked ? "Pot locked" : `Pot draining: ${pot} gold`}
    >
      <span className="font-display text-2xl tabular-nums leading-none">🪙{pot}</span>
      <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
        {locked ? "locked" : "draining"}
      </span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------

const ANSWER_STYLES = [
  { border: "border-neon-cyan/70", glow: "shadow-neon-cyan", text: "text-neon-cyan" },
  { border: "border-neon-gold/70", glow: "shadow-neon-gold", text: "text-neon-gold" },
  { border: "border-neon-pink/70", glow: "shadow-neon-pink", text: "text-neon-pink" },
  { border: "border-neon-green/70", glow: "shadow-neon-green", text: "text-neon-green" },
  { border: "border-neon-purple/70", glow: "shadow-neon-purple", text: "text-neon-purple" },
  { border: "border-white/50", glow: "", text: "text-white" },
];

/** Cannonball: blow a hole through the middle of every word. */
function holeWords(text: string): string {
  return text
    .split(" ")
    .map((w) => {
      if (w.length <= 2) return w;
      if (w.length === 3) return `${w[0]}●${w[2]}`;
      return `${w[0]}${"●".repeat(w.length - 2)}${w[w.length - 1]}`;
    })
    .join(" ");
}

function ChoiceGrid() {
  const game = useGameStore((s) => s.game);
  const priv = useGameStore((s) => s.priv);
  const [choice, setChoice] = useState<number | undefined>();
  const [burstAt, setBurstAt] = useState<number | undefined>();

  useEffect(() => {
    setChoice(undefined);
    setBurstAt(undefined);
  }, [game?.question?.id]);

  if (!game?.question) return null;
  const disabled = new Set(priv?.disabledOptions ?? []);
  const revealed = priv?.revealedAnswerIndex;
  const holed = Boolean(priv?.cannonballed);
  const mutinied = Boolean(priv?.hasMutinied);
  const parroting = priv?.parrotTargetId
    ? game.players.find((p) => p.id === priv.parrotTargetId)
    : undefined;
  const twoCol = game.question.options.length > 4;

  const submit = (i: number) => {
    if (mutinied) return;
    const changing = choice !== undefined;
    setChoice(i);
    setBurstAt(i);
    setTimeout(() => setBurstAt(undefined), 900);
    if (changing) {
      sfx.select();
    } else {
      sfx.lock();
    }
    socket.emit("answer:submit", { choiceIndex: i });
  };

  return (
    <div className={`grid gap-3 ${twoCol ? "grid-cols-2" : "grid-cols-1"}`}>
      {parroting && (
        <p className="col-span-full -mb-1 text-center text-xs font-bold text-neon-green">
          🦜 Your parrot copies {parroting.avatar} {parroting.nickname} — your pick won't count!
        </p>
      )}
      {game.question.options.map((opt, i) => {
        const style = ANSWER_STYLES[i % ANSWER_STYLES.length] ?? ANSWER_STYLES[0]!;
        const isMine = choice === i;
        const isDisabled = disabled.has(i);
        const isRevealed = revealed === i;
        const dimmed = choice !== undefined && !isMine;
        return (
          <motion.button
            key={`${game.question?.id}-${i}`}
            initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60, rotate: i % 2 === 0 ? -2 : 2 }}
            animate={{
              opacity: dimmed ? 0.45 : 1,
              x: 0,
              rotate: 0,
              scale: isMine ? 1.03 : 1,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: i * 0.08 }}
            whileHover={{ scale: isMine ? 1.03 : 1.02 }}
            whileTap={{ scale: 0.94, rotate: 0 }}
            disabled={isDisabled || mutinied}
            onClick={() => submit(i)}
            className={`neon-card relative flex min-h-[72px] items-center gap-3 overflow-visible border-2 px-3 py-3 text-left transition-colors ${style.border} ${
              isMine
                ? `bg-black/45 ${style.glow} animate-ring-pulse`
                : `bg-black/35 hover:bg-black/45 ${dimmed ? "" : style.glow.replace("shadow", "hover:shadow")}`
            } ${isDisabled || mutinied ? "opacity-20" : ""} ${
              isRevealed ? "!border-neon-gold ring-2 ring-neon-gold shadow-neon-gold" : ""
            }`}
            aria-pressed={isMine}
          >
            <motion.div
              animate={isMine ? { scale: [1, 1.08, 1], y: [0, -2, 0] } : {}}
              transition={{ duration: 0.45 }}
              className="relative shrink-0"
              aria-hidden
            >
              <HfSprite
                frame={islandFrame(i)}
                size={twoCol ? 56 : 64}
                className="drop-shadow-[0_0_12px_rgba(46,230,255,0.4)]"
              />
              <span
                className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-black/80 font-display text-xs ${style.border} ${style.text}`}
              >
                {isMine ? "✓" : LETTERS[i]}
              </span>
            </motion.div>
            <span className="flex-1 text-base font-black leading-snug">
              {holed ? holeWords(opt) : opt}
            </span>
            {isRevealed && (
              <motion.span
                className="text-2xl"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                aria-label="Secret X: this is the correct answer"
              >
                ❌
              </motion.span>
            )}
            {isDisabled && (
              <span
                className="absolute -right-1 -top-2 rounded-full bg-black/80 px-1.5 py-0.5 text-xs"
                aria-label="Removed by eyepatch"
              >
                🏴‍☠️💨
              </span>
            )}
            {isMine && <LockStamp text="LOCKED IN" />}
            {burstAt === i && <EmojiBurst emoji="🪙" count={8} distance={70} />}
          </motion.button>
        );
      })}
      {mutinied && (
        <p className="col-span-full text-center text-sm font-black text-neon-red">
          🏴 MUTINY DECLARED — your answer is forfeited.
        </p>
      )}
      {choice !== undefined && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-full text-center text-xs font-bold text-neon-cyan"
        >
          Tap another answer to switch (the pot keeps draining)
        </motion.p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Million Pound Drop trapdoor allocator
// ---------------------------------------------------------------------------

function TrapdoorAllocator() {
  const game = useGameStore((s) => s.game);
  const priv = useGameStore((s) => s.priv);
  const [alloc, setAlloc] = useState<number[]>([0, 0, 0, 0]);
  const [sent, setSent] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    setAlloc([0, 0, 0, 0]);
    setSent(false);
    setBurst(false);
  }, [game?.question?.id]);

  const total = alloc.reduce((a, b) => a + b, 0);
  const pool = priv?.lootDropPool ?? ARCADE.MPD_POOL;
  const remaining = pool - total;
  if (!game?.question) return null;

  const bump = (i: number, delta: number) => {
    setAlloc((prev) => {
      const next = [...prev];
      const current = next[i] ?? 0;
      const value = Math.max(0, Math.min(current + delta, current + remaining));
      if (value !== current) {
        if (delta > 0) {
          sfx.tap();
        } else {
          sfx.select();
        }
      }
      next[i] = value;
      return next;
    });
    setSent(false);
  };

  const lockIn = () => {
    sfx.lock();
    setBurst(true);
    setTimeout(() => setBurst(false), 900);
    socket.emit("answer:submit", { lootAllocation: alloc });
    setSent(true);
  };

  return (
    <div className="relative flex flex-col gap-2.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-slate-300">⚓ Send your block treasure on ventures</span>
        <motion.span
          key={remaining}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          className={`font-display text-xl ${remaining === 0 ? "text-neon-green" : "text-neon-gold"}`}
        >
          🪙 {remaining} left
        </motion.span>
      </div>
      {game.question.options.map((opt, i) => {
        const amount = alloc[i] ?? 0;
        const coinStack = Math.min(6, Math.ceil(amount / 20));
        return (
          <motion.div
            key={`${game.question?.id}-${i}`}
            initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
            animate={{ opacity: 1, x: 0, scale: amount > 0 ? 1.01 : 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 20, delay: i * 0.07 }}
            className={`neon-card relative flex items-center gap-2 border-2 bg-black/35 p-2.5 transition-colors ${
              amount > 0 ? "border-neon-gold/60 shadow-neon-gold bg-amber-400/5" : "border-white/10"
            }`}
          >
            <motion.div
              animate={amount > 0 ? { y: [0, -3, 0] } : {}}
              transition={{ repeat: Infinity, duration: 1.8 }}
              aria-hidden
            >
              <HfSprite frame={islandFrame(i)} size={52} label={`Trapdoor ${LETTERS[i]}`} />
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black">{opt}</div>
              <div className="mt-1.5 flex h-4 items-center gap-1">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 shadow-neon-gold"
                    animate={{ width: `${pool > 0 ? (amount / pool) * 100 : 0}%` }}
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                  />
                </div>
                <span className="w-12 text-xs" aria-hidden>
                  {"🪙".repeat(coinStack)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.8 }}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/20 text-xl font-black"
                onClick={() => bump(i, -10)}
                aria-label={`Remove 10 gold from ${opt}`}
              >
                −
              </motion.button>
              <motion.span
                key={amount}
                initial={{ scale: 1.5, color: "#fff" }}
                animate={{ scale: 1, color: "#fbbf24" }}
                className="w-9 text-center font-display text-xl tabular-nums"
              >
                {amount}
              </motion.span>
              <motion.button
                whileTap={{ scale: 0.8 }}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-neon-gold/60 text-xl font-black text-neon-gold shadow-neon-gold"
                onClick={() => bump(i, 10)}
                aria-label={`Add 10 gold to ${opt}`}
              >
                +
              </motion.button>
            </div>
          </motion.div>
        );
      })}
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn-gold w-full text-xl"
          disabled={total !== pool || sent || pool === 0}
          onClick={lockIn}
        >
          {sent ? "⚓ Crews dispatched!" : `SET SAIL (${total}/${pool})`}
        </motion.button>
        {burst && <EmojiBurst emoji="🪙" count={14} distance={110} />}
      </div>
      <p className="text-center text-[11px] text-slate-500">
        Allocate every coin. Wrong ventures lose their treasure.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Player row: live status + ATTACK TARGETING
// ---------------------------------------------------------------------------

function PlayerTargetRow() {
  const game = useGameStore((s) => s.game);
  const playerId = useGameStore((s) => s.playerId);
  const targeting = useGameStore((s) => s.targeting);
  const setTargeting = useGameStore((s) => s.setTargeting);
  const firedFx = useGameStore((s) => s.firedFx);
  const [impactAt, setImpactAt] = useState<string | undefined>();
  const rowRef = useRef<HTMLDivElement>(null);

  // When an attack lands, flash an impact on the victims.
  useEffect(() => {
    if (!firedFx) return;
    sfx.cannonIncoming();
    const t = setTimeout(() => setImpactAt(firedFx.targetIds[0]), 500);
    const t2 = setTimeout(() => setImpactAt(undefined), 1600);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [firedFx?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!game) return null;
  const armed = targeting ? POWERUPS[targeting.powerUpId] : undefined;

  const fire = (targetId: string) => {
    if (!targeting || targetId === playerId) return;
    socket.emit("powerup:use", { uid: targeting.uid, targetId });
    setTargeting(undefined);
    sfx.boom();
  };

  return (
    <div className="pt-1" ref={rowRef}>
      <AnimatePresence>
        {armed && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-2 flex items-center justify-between rounded-xl border border-neon-pink/60 bg-pink-950/40 px-3 py-1.5 text-xs font-bold text-neon-pink shadow-neon-pink"
          >
            <span>
              {armed.icon} {armed.name} armed — tap a pirate!
            </span>
            <button className="underline underline-offset-2" onClick={() => setTargeting(undefined)}>
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="flex flex-wrap items-end justify-center gap-3"
        role={armed ? "group" : undefined}
        aria-label={armed ? "Pick a target" : "Crew status"}
      >
        {game.players.map((p, i) => {
          const isMe = p.id === playerId;
          const targetable = Boolean(armed) && !isMe && !p.marooned;
          const isVictim = firedFx?.targetIds.includes(p.id);
          return (
            <Shaker key={p.id} trigger={impactAt === p.id ? firedFx?.key : undefined}>
              <motion.button
                layout
                disabled={!targetable}
                onClick={() => fire(p.id)}
                className={`relative flex flex-col items-center gap-0.5 rounded-2xl p-1.5 transition ${
                  targetable
                    ? "cursor-crosshair border-2 border-neon-pink/70 bg-pink-500/10 shadow-neon-pink"
                    : "border-2 border-transparent"
                }`}
                animate={
                  targetable
                    ? { scale: [1, 1.08, 1] }
                    : p.hasAnswered
                      ? { scale: [1, 1.12, 1] }
                      : {}
                }
                transition={
                  targetable ? { repeat: Infinity, duration: 0.9 } : { duration: 0.35 }
                }
                aria-label={
                  targetable ? `Fire at ${p.nickname}` : `${p.nickname}${isMe ? " (you)" : ""}`
                }
              >
                {targetable && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm" aria-hidden>
                    🎯
                  </span>
                )}
                <PirateAvatar
                  playerId={p.id}
                  emoji={p.avatar}
                  size={40}
                  bobDelay={i * 0.25}
                  mood={
                    p.marooned
                      ? "nervous"
                      : isVictim
                        ? "attacked"
                        : p.hasAnswered
                          ? "answered"
                          : "nervous"
                  }
                />
                {p.marooned && (
                  <span className="absolute -right-1 -top-1 text-sm" aria-label="Marooned">
                    🏝️
                  </span>
                )}
                {game.arcade?.leaderId === p.id && (
                  <span className="absolute -left-1 -top-1 text-sm" aria-label="Captain">
                    👑
                  </span>
                )}
                <span
                  className={`max-w-[9ch] truncate text-[10px] font-bold ${p.connected ? "text-slate-300" : "text-slate-600"}`}
                >
                  {isMe ? "you" : p.nickname}
                </span>
                {isVictim && impactAt === p.id && <CannonBlast small />}
              </motion.button>
            </Shaker>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mutiny — secret, simultaneous, ever-present
// ---------------------------------------------------------------------------

function MutinyPanel() {
  const game = useGameStore((s) => s.game);
  const priv = useGameStore((s) => s.priv);
  const playerId = useGameStore((s) => s.playerId);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => setConfirming(false), [game?.question?.id]);

  if (!game?.arcade || game.arcade.roundNumber <= ARCADE.FIRST_ITEM_WINDOW) return null;
  const leader = game.players.find((p) => p.id === game.arcade?.leaderId);
  const iAmLeader = leader?.id === playerId;
  const declared = Boolean(priv?.hasMutinied);

  if (iAmLeader) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-xs font-bold text-neon-gold/80"
      >
        👑 You're the captain. The crew may be plotting — get this RIGHT.
      </motion.p>
    );
  }
  if (!leader) return null;

  if (declared) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-xl border border-neon-red/50 bg-rose-950/40 px-3 py-2 text-center text-xs font-bold text-neon-red"
      >
        🏴 Mutiny declared against {leader.nickname} — nobody knows but you.
        <br />
        <span className="text-[10px] font-normal text-rose-200/70">
          You cannot answer. Alone = marooned. Only a unanimous crew can tax a wrong captain.
        </span>
      </motion.div>
    );
  }

  return (
    <div>
      {!confirming ? (
        <button
          className="btn-ghost w-full !min-h-0 !border-neon-red/40 !py-2 !text-sm !text-neon-red"
          onClick={() => {
            sfx.mutinyDrum();
            setConfirming(true);
          }}
        >
          🏴 MUTINY vs {leader.avatar} {leader.nickname} 👑
        </button>
      ) : (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="neon-card border-neon-red/50 p-3 text-center"
        >
          <p className="text-xs font-bold">
            Mutiny forfeits your answer. If the whole crew joins and the captain is wrong,
            the captain pays everyone.
            <br />
            <span className="text-neon-gold">Mutiny alone and you are MAROONED 🏝️</span>
          </p>
          <div className="mt-2 flex gap-2">
            <button
              className="btn-pink flex-1 !min-h-0 !py-2 !text-sm"
              onClick={() => {
                socket.emit("mutiny:declare");
                sfx.alarm();
                setConfirming(false);
              }}
            >
              ⚔️ Do it
            </button>
            <button
              className="btn-ghost flex-1 !min-h-0 !py-2 !text-sm"
              onClick={() => setConfirming(false)}
            >
              Stand down
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

/** Walk the Plank: urgent countdown when someone forces you to answer fast. */
function PlankBanner() {
  const priv = useGameStore((s) => s.priv);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!priv?.plankUntil) return;
    const iv = setInterval(() => {
      setLeft(Math.max(0, Math.ceil(((priv.plankUntil ?? 0) - Date.now()) / 1000)));
    }, 200);
    return () => clearInterval(iv);
  }, [priv?.plankUntil]);

  if (!priv?.plankUntil || left <= 0) return null;
  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ repeat: Infinity, duration: 0.5 }}
      className="rounded-xl border-2 border-neon-red bg-rose-950/60 px-3 py-2 text-center font-display text-lg text-neon-red shadow-neon-pink"
      role="alert"
    >
      🪵 WALK THE PLANK — answer in {left}s or get NOTHING!
    </motion.div>
  );
}

/** Telescope: events on the horizon. */
function HorizonBanner() {
  const priv = useGameStore((s) => s.priv);
  if (!priv?.horizon) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-neon-cyan/50 bg-cyan-950/40 px-3 py-2 text-xs text-neon-cyan"
    >
      <span className="font-display">🔭 ON THE HORIZON</span>
      {priv.horizon.split("\n").map((line, i) => (
        <div key={i} className="mt-0.5 text-cyan-100/80">
          {line}
        </div>
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Marooned: you sit this one out
// ---------------------------------------------------------------------------

function MaroonedScreen() {
  const game = useGameStore((s) => s.game);
  return (
    <Screen className="items-center justify-center gap-5 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className="flex flex-col items-center gap-3"
      >
        <motion.span
          className="text-8xl"
          animate={{ y: [0, -8, 0], rotate: [0, 2, -2, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
          aria-hidden
        >
          🏝️
        </motion.span>
        <h1 className="font-display text-4xl text-neon-gold title-glow">MAROONED</h1>
        <p className="max-w-xs text-sm text-slate-300">
          You sit this question out. Enjoy the coconuts — you're back next round.
        </p>
        {game && (
          <div className="w-full max-w-xs">
            <TimerBar endsAt={game.timerEndsAt} />
          </div>
        )}
        <motion.span
          className="text-3xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          aria-hidden
        >
          🥥
        </motion.span>
      </motion.div>
    </Screen>
  );
}
