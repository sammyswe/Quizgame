import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { SCORING } from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { Screen, TimerBar } from "../components/ui";
import { MissionCard } from "../components/MissionCard";
import { EmojiBurst, LockStamp } from "../components/fx";
import { PirateAvatar } from "../components/players/PirateAvatar";
import { sfx } from "../lib/sfx";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const ISLAND_ICONS = ["🏝️", "🌋", "🗿", "🪸"];

export function QuestionScreen() {
  const game = useGameStore((s) => s.game);
  const me = useGameStore((s) => s.me());
  if (!game?.question || !me) return null;
  const isLootDrop = game.currentRound === "lootDrop";

  return (
    <Screen className="gap-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-bold uppercase tracking-wider">
          {game.currentRound && `Q${game.questionNumber}`}
          {game.currentRound === "captainsChase" && game.chase
            ? ` of ${game.chase.totalQuestions}`
            : game.totalQuestionsInRound > 1
              ? ` of ${game.totalQuestionsInRound}`
              : ""}
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 capitalize">
          {game.question.category} · {game.question.difficulty}
        </span>
      </div>

      <TimerBar endsAt={game.timerEndsAt} />

      {game.currentRound === "captainsChase" && <ChaseTrack />}
      {game.currentRound === "falseMap" && <FalseMapBanner />}
      <PrivateClueBanner />
      <MissionCard />

      <motion.h1
        key={game.question.id}
        initial={{ opacity: 0, y: -30, scale: 0.9, rotate: -1.5 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="neon-card border-2 border-neon-gold/30 px-4 py-4 text-center font-display text-2xl leading-snug text-outline shadow-neon-gold"
      >
        {game.question.prompt}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0.6, 1] }}
        transition={{ duration: 2.4, delay: 0.5 }}
        className="text-center text-xs font-bold text-neon-cyan/90"
      >
        🗣️ Talk it out. Persuade. Lie. This is the fun part.
      </motion.p>

      {isLootDrop ? <LootAllocator /> : <ChoiceGrid />}

      <AnswerStatusRow />
      {game.currentRound === "falseMap" && <AccusePanel />}
      {isLootDrop && <PactPanel />}
    </Screen>
  );
}

// ---------------------------------------------------------------------------

const ANSWER_STYLES = [
  { border: "border-neon-cyan/70", glow: "shadow-neon-cyan", text: "text-neon-cyan", island: "🏝️" },
  { border: "border-neon-gold/70", glow: "shadow-neon-gold", text: "text-neon-gold", island: "🌋" },
  { border: "border-neon-pink/70", glow: "shadow-neon-pink", text: "text-neon-pink", island: "🗿" },
  {
    border: "border-neon-green/70",
    glow: "shadow-neon-green",
    text: "text-neon-green",
    island: "🪸",
  },
  {
    border: "border-neon-purple/70",
    glow: "shadow-neon-purple",
    text: "text-neon-purple",
    island: "⚓",
  },
  { border: "border-white/50", glow: "", text: "text-white", island: "🌊" },
];

function ChoiceGrid() {
  const game = useGameStore((s) => s.game);
  const priv = useGameStore((s) => s.priv);
  const me = useGameStore((s) => s.me());
  const [choice, setChoice] = useState<number | undefined>();
  const [burstAt, setBurstAt] = useState<number | undefined>();

  useEffect(() => {
    setChoice(undefined);
    setBurstAt(undefined);
  }, [game?.question?.id]);

  if (!game?.question) return null;
  const disabled = new Set(priv?.disabledOptions ?? []);
  const hardLocked = Boolean(priv?.answerLocked) && Boolean(me?.hasAnswered);
  const twoCol = game.question.options.length > 4;

  const submit = (i: number) => {
    if (hardLocked) return;
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
      {game.question.options.map((opt, i) => {
        const style = ANSWER_STYLES[i % ANSWER_STYLES.length] ?? ANSWER_STYLES[0]!;
        const isMine = choice === i;
        const isDisabled = disabled.has(i);
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
            whileHover={{
              scale: isMine ? 1.03 : 1.02,
              rotate: isMine ? 0 : i % 2 === 0 ? -0.5 : 0.5,
            }}
            whileTap={{ scale: 0.94, rotate: 0 }}
            disabled={isDisabled || hardLocked}
            onClick={() => submit(i)}
            className={`neon-card relative flex min-h-[64px] items-center gap-3 overflow-visible border-2 px-4 py-3.5 text-left transition-colors ${style.border} ${
              isMine
                ? `bg-white/10 ${style.glow} animate-ring-pulse`
                : `hover:bg-white/5 ${dimmed ? "" : style.glow.replace("shadow", "hover:shadow")}`
            } ${isDisabled ? "opacity-20" : ""}`}
            aria-pressed={isMine}
          >
            {/* Letter coin */}
            <motion.span
              animate={isMine ? { rotate: [0, -12, 12, 0], scale: [1, 1.25, 1] } : {}}
              transition={{ duration: 0.45 }}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-black/40 font-display text-xl ${style.border} ${style.text}`}
              aria-hidden
            >
              {isMine ? "✓" : LETTERS[i]}
            </motion.span>
            <span
              className={`flex-1 text-base font-black leading-snug ${isDisabled ? "line-through" : ""}`}
            >
              {opt}
            </span>
            <span className="text-xl opacity-70" aria-hidden>
              {style.island}
            </span>
            {isDisabled && (
              <span
                className="absolute -right-1 -top-2 rounded-full bg-black/80 px-1.5 py-0.5 text-xs"
                aria-label="Removed by spyglass"
              >
                🔭💨
              </span>
            )}
            {isMine && <LockStamp text={hardLocked ? "SABOTAGED" : "LOCKED IN"} />}
            {burstAt === i && <EmojiBurst emoji="🪙" count={8} distance={70} />}
          </motion.button>
        );
      })}
      {choice !== undefined && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-xs font-bold text-neon-cyan"
        >
          {hardLocked
            ? "🪢 Sabotaged — no switching for you!"
            : "⚓ Answer dropped! You can still switch until the timer runs out."}
        </motion.p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function LootAllocator() {
  const game = useGameStore((s) => s.game);
  const [alloc, setAlloc] = useState<number[]>([0, 0, 0, 0]);
  const [confident, setConfident] = useState(false);
  const [sent, setSent] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    setAlloc([0, 0, 0, 0]);
    setConfident(false);
    setSent(false);
    setBurst(false);
  }, [game?.question?.id]);

  const total = alloc.reduce((a, b) => a + b, 0);
  const remaining = SCORING.LOOT_POOL - total;
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
    socket.emit("answer:submit", { lootAllocation: alloc, confident });
    setSent(true);
  };

  return (
    <div className="relative flex flex-col gap-2.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-slate-300">Split yer loot across the islands:</span>
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
            className={`neon-card relative flex items-center gap-2 border-2 p-2.5 transition-colors ${
              amount > 0 ? "border-neon-gold/60 shadow-neon-gold bg-amber-400/5" : "border-white/10"
            }`}
          >
            <motion.span
              className="text-2xl"
              animate={amount > 0 ? { y: [0, -3, 0] } : {}}
              transition={{ repeat: Infinity, duration: 1.8 }}
              aria-hidden
            >
              {ISLAND_ICONS[i]}
            </motion.span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black">{opt}</div>
              <div className="mt-1.5 flex h-4 items-center gap-1">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 shadow-neon-gold"
                    animate={{ width: `${amount}%` }}
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
                aria-label={`Remove 10 loot from ${opt}`}
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
                aria-label={`Add 10 loot to ${opt}`}
              >
                +
              </motion.button>
            </div>
          </motion.div>
        );
      })}
      <motion.label
        whileTap={{ scale: 0.98 }}
        className={`flex items-center justify-between gap-2 rounded-2xl border-2 px-4 py-2.5 transition-colors ${
          confident
            ? "border-neon-pink bg-pink-500/20 shadow-neon-pink"
            : "border-neon-pink/40 bg-pink-950/30"
        }`}
      >
        <span className="text-sm font-bold">
          😤 Confidence token{" "}
          <span className="text-slate-400">
            (+{SCORING.CONFIDENCE_BONUS} if half+ survives, −{SCORING.CONFIDENCE_PENALTY} if not)
          </span>
        </span>
        <input
          type="checkbox"
          checked={confident}
          onChange={(e) => {
            setConfident(e.target.checked);
            if (e.target.checked) sfx.alarm();
            setSent(false);
          }}
          className="h-6 w-6 accent-pink-400"
        />
      </motion.label>
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn-gold w-full text-xl"
          disabled={total === 0 || sent}
          onClick={lockIn}
        >
          {sent ? "⚓ Loot placed! (tap +/− to adjust)" : `💰 Drop the Loot! (${total} placed)`}
        </motion.button>
        {burst && <EmojiBurst emoji="🪙" count={14} distance={110} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function AnswerStatusRow() {
  const game = useGameStore((s) => s.game);
  if (!game) return null;
  return (
    <div className="flex flex-wrap items-end justify-center gap-3 pt-1">
      {game.players.map((p, i) => (
        <motion.div
          key={p.id}
          layout
          className="flex flex-col items-center gap-0.5"
          animate={p.hasAnswered ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.35 }}
        >
          <PirateAvatar
            playerId={p.id}
            emoji={p.avatar}
            size={38}
            bobDelay={i * 0.25}
            mood={p.hasAnswered ? "answered" : "nervous"}
          />
          <span
            className={`max-w-[9ch] truncate text-[10px] font-bold ${p.connected ? "text-slate-300" : "text-slate-600"}`}
          >
            {p.nickname}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

function FalseMapBanner() {
  const game = useGameStore((s) => s.game);
  if (!game?.falseMap) return null;
  const captains = game.players.filter((p) => game.falseMap?.captainIds.includes(p.id));
  return (
    <div className="rounded-2xl border border-neon-pink/50 bg-pink-950/30 px-4 py-3 text-center text-sm shadow-neon-pink">
      <span className="font-display text-neon-pink">TWO CAPTAINS, TWO MAPS 🗺️</span>
      <p className="mt-1">
        {captains.map((c) => `${c.avatar} ${c.nickname}`).join(" and ")} hold private maps.{" "}
        <b>One map is FALSE.</b> Someone's map smells fake...
      </p>
    </div>
  );
}

function PrivateClueBanner() {
  const priv = useGameStore((s) => s.priv);
  if (!priv?.privateClue || priv.privateClue === "__PENDING__") return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-neon-purple/60 bg-purple-950/40 px-4 py-3 text-sm shadow-neon-purple"
    >
      <span className="rounded-full bg-neon-purple/20 px-2 py-0.5 text-[10px] font-black uppercase text-neon-purple">
        Private — only you can see this
      </span>
      <p className="mt-1.5 font-bold">{priv.privateClue}</p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function AccusePanel() {
  const game = useGameStore((s) => s.game);
  const me = useGameStore((s) => s.me());
  const playerId = useGameStore((s) => s.playerId);
  const [open, setOpen] = useState(false);
  if (!game || !me) return null;
  const tokens = me.mutinyTokens;

  return (
    <div className="pt-1">
      {!open ? (
        <button className="btn-pink w-full" disabled={tokens <= 0} onClick={() => setOpen(true)}>
          ⚔️ MUTINY! Accuse a deceiver ({tokens} token{tokens === 1 ? "" : "s"})
        </button>
      ) : (
        <div className="neon-card border-neon-pink/50 p-3">
          <p className="mb-2 text-center text-sm font-bold">
            Who's scheming? Correct: +{SCORING.ACCUSATION_CORRECT} & their plot burns. Wrong: they
            profit.
          </p>
          <div className="flex flex-col gap-1.5">
            {game.players
              .filter((p) => p.id !== playerId)
              .map((p) => (
                <button
                  key={p.id}
                  className="btn-ghost justify-start !text-base"
                  onClick={() => {
                    socket.emit("mutiny:accuse", p.id);
                    setOpen(false);
                  }}
                >
                  {p.avatar} Accuse {p.nickname}!
                </button>
              ))}
            <button className="btn-ghost !text-sm" onClick={() => setOpen(false)}>
              Never mind
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function PactPanel() {
  const game = useGameStore((s) => s.game);
  const playerId = useGameStore((s) => s.playerId);
  const [open, setOpen] = useState(false);
  const [offered, setOffered] = useState(false);

  useEffect(() => {
    setOffered(false);
    setOpen(false);
  }, [game?.question?.id]);

  if (!game) return null;
  return (
    <div>
      {!open ? (
        <button
          className="btn-ghost w-full !text-sm"
          disabled={offered}
          onClick={() => setOpen(true)}
        >
          🤝{" "}
          {offered
            ? "Pact offered..."
            : `Offer a trust pact (+${SCORING.PACT_BONUS} each if you both nail it)`}
        </button>
      ) : (
        <div className="neon-card p-3">
          <p className="mb-2 text-center text-xs text-slate-300">
            If you BOTH put your biggest pile on the true island, +{SCORING.PACT_BONUS} each and an
            Honour Chest. If one of you is wrong... awkward.
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {game.players
              .filter((p) => p.id !== playerId)
              .map((p) => (
                <button
                  key={p.id}
                  className="rounded-full border border-neon-green/50 px-3 py-1.5 text-sm font-bold hover:bg-neon-green/10"
                  onClick={() => {
                    socket.emit("pact:offer", p.id);
                    setOffered(true);
                    setOpen(false);
                  }}
                >
                  {p.avatar} {p.nickname}
                </button>
              ))}
            <button
              className="rounded-full border border-white/20 px-3 py-1.5 text-sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function ChaseTrack() {
  const game = useGameStore((s) => s.game);
  const chase = game?.chase;
  const trackLen = 10;
  const ships = useMemo(() => {
    if (!chase || !game) return [];
    return Object.entries(chase.positions)
      .map(([id, pos]) => {
        const p = game.players.find((x) => x.id === id);
        return {
          id,
          pos,
          avatar: p?.avatar ?? "⛵",
          name: p?.nickname ?? "?",
          isCaptain: id === chase.captainId,
        };
      })
      .sort((a, b) => (a.isCaptain ? -1 : b.isCaptain ? 1 : 0));
  }, [chase, game]);

  if (!chase) return null;
  return (
    <div className="neon-card border-neon-cyan/40 p-3">
      <div className="mb-1 flex justify-between text-[11px] font-bold uppercase tracking-wide text-slate-400">
        <span>
          🌊 The chase — Q{Math.min(chase.questionNumber, chase.totalQuestions)}/
          {chase.totalQuestions}
        </span>
        <span>Catch the Captain! ⚓</span>
      </div>
      <div className="relative h-14 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60">
        <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 bg-cyan-400/20" />
        <AnimatePresence>
          {ships.map((ship, i) => (
            <motion.div
              key={ship.id}
              animate={{
                left: `${6 + (Math.min(ship.pos, trackLen) / trackLen) * 82}%`,
                top: ship.isCaptain ? "18%" : `${42 + (i % 3) * 18}%`,
              }}
              transition={{ type: "spring", stiffness: 80, damping: 14 }}
              className="absolute -translate-x-1/2"
            >
              <span
                className={`text-xl ${ship.isCaptain ? "drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" : ""}`}
                aria-label={`${ship.name} at position ${ship.pos}`}
              >
                {ship.isCaptain ? "🚢" : ship.avatar}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-2xl" aria-hidden>
          🌅
        </span>
      </div>
    </div>
  );
}
