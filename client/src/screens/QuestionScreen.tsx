import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { SCORING } from "@treasure-trap/shared";
import { socket } from "../net/socket";
import { useGameStore } from "../store/gameStore";
import { PlayerChip, Screen, TimerBar } from "../components/ui";
import { MissionCard } from "../components/MissionCard";

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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="neon-card px-4 py-4 text-center font-display text-2xl leading-snug text-outline"
      >
        {game.question.prompt}
      </motion.h1>

      <p className="text-center text-xs text-neon-cyan/80">
        🗣️ Talk it out. Persuade. Lie. This is the fun part.
      </p>

      {isLootDrop ? <LootAllocator /> : <ChoiceGrid />}

      <AnswerStatusRow />
      {game.currentRound === "falseMap" && <AccusePanel />}
      {isLootDrop && <PactPanel />}
    </Screen>
  );
}

// ---------------------------------------------------------------------------

function ChoiceGrid() {
  const game = useGameStore((s) => s.game);
  const priv = useGameStore((s) => s.priv);
  const me = useGameStore((s) => s.me());
  const [choice, setChoice] = useState<number | undefined>();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setChoice(undefined);
    setLocked(false);
  }, [game?.question?.id]);

  if (!game?.question) return null;
  const disabled = new Set(priv?.disabledOptions ?? []);
  const hardLocked = Boolean(priv?.answerLocked) && Boolean(me?.hasAnswered);
  const colors = [
    "border-neon-cyan/60 hover:shadow-neon-cyan",
    "border-neon-gold/60 hover:shadow-neon-gold",
    "border-neon-pink/60 hover:shadow-neon-pink",
    "border-neon-green/60 hover:shadow-neon-green",
    "border-neon-purple/60 hover:shadow-neon-purple",
    "border-white/40",
  ];

  const submit = (i: number) => {
    if (hardLocked) return;
    setChoice(i);
    setLocked(true);
    socket.emit("answer:submit", { choiceIndex: i });
  };

  return (
    <div className={`grid gap-2.5 ${game.question.options.length > 4 ? "grid-cols-2" : "grid-cols-1"}`}>
      {game.question.options.map((opt, i) => {
        const isMine = choice === i;
        const isDisabled = disabled.has(i);
        return (
          <motion.button
            key={i}
            whileTap={{ scale: 0.97 }}
            disabled={isDisabled || hardLocked}
            onClick={() => submit(i)}
            className={`neon-card relative flex min-h-[56px] items-center gap-3 border-2 px-4 py-3 text-left transition ${
              colors[i % colors.length]
            } ${isMine ? "bg-white/10 ring-2 ring-neon-gold shadow-neon-gold" : ""} ${
              isDisabled ? "opacity-25 line-through" : ""
            }`}
            aria-pressed={isMine}
          >
            <span className="font-display text-lg text-neon-gold">{LETTERS[i]}</span>
            <span className="flex-1 text-base font-bold">{opt}</span>
            {isMine && <span aria-hidden>🔒</span>}
            {isDisabled && (
              <span className="text-xs" aria-label="Removed by spyglass">
                🔭
              </span>
            )}
          </motion.button>
        );
      })}
      {locked && (
        <p className="text-center text-xs text-slate-400">
          Locked in — but you can switch until the timer ends{priv?.answerLocked ? " (unless sabotaged!)" : ""}.
        </p>
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

  useEffect(() => {
    setAlloc([0, 0, 0, 0]);
    setConfident(false);
    setSent(false);
  }, [game?.question?.id]);

  const total = alloc.reduce((a, b) => a + b, 0);
  const remaining = SCORING.LOOT_POOL - total;
  if (!game?.question) return null;

  const bump = (i: number, delta: number) => {
    setAlloc((prev) => {
      const next = [...prev];
      const current = next[i] ?? 0;
      next[i] = Math.max(0, Math.min(current + delta, current + remaining));
      return next;
    });
    setSent(false);
  };

  const lockIn = () => {
    socket.emit("answer:submit", { lootAllocation: alloc, confident });
    setSent(true);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-slate-300">Split yer loot across the islands:</span>
        <span className={`font-display text-xl ${remaining === 0 ? "text-neon-green" : "text-neon-gold"}`}>
          🪙 {remaining} left
        </span>
      </div>
      {game.question.options.map((opt, i) => (
        <div key={i} className="neon-card flex items-center gap-2 border-2 border-white/10 p-2.5">
          <span className="text-2xl" aria-hidden>
            {ISLAND_ICONS[i]}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{opt}</div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-neon-gold shadow-neon-gold"
                animate={{ width: `${alloc[i] ?? 0}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-lg font-black active:scale-90"
              onClick={() => bump(i, -10)}
              aria-label={`Remove 10 loot from ${opt}`}
            >
              −
            </button>
            <span className="w-8 text-center font-display text-lg text-neon-gold tabular-nums">
              {alloc[i]}
            </span>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neon-gold/50 text-lg font-black text-neon-gold active:scale-90"
              onClick={() => bump(i, 10)}
              aria-label={`Add 10 loot to ${opt}`}
            >
              +
            </button>
          </div>
        </div>
      ))}
      <label className="flex items-center justify-between gap-2 rounded-2xl border border-neon-pink/40 bg-pink-950/30 px-4 py-2.5">
        <span className="text-sm font-bold">
          😤 Confidence token <span className="text-slate-400">(+{SCORING.CONFIDENCE_BONUS} if half+ survives, −{SCORING.CONFIDENCE_PENALTY} if not)</span>
        </span>
        <input
          type="checkbox"
          checked={confident}
          onChange={(e) => {
            setConfident(e.target.checked);
            setSent(false);
          }}
          className="h-5 w-5 accent-pink-400"
        />
      </label>
      <button className="btn-gold w-full" disabled={total === 0 || sent} onClick={lockIn}>
        {sent ? "Loot placed! (tap islands to adjust)" : `Drop the Loot! (${total} placed)`}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

function AnswerStatusRow() {
  const game = useGameStore((s) => s.game);
  if (!game) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
      {game.players.map((p) => (
        <PlayerChip
          key={p.id}
          player={p}
          highlight={p.hasAnswered}
          suffix={
            <span aria-label={p.hasAnswered ? "answered" : "thinking"}>
              {p.hasAnswered ? "✅" : "💭"}
            </span>
          }
        />
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
        <button
          className="btn-pink w-full"
          disabled={tokens <= 0}
          onClick={() => setOpen(true)}
        >
          ⚔️ MUTINY! Accuse a deceiver ({tokens} token{tokens === 1 ? "" : "s"})
        </button>
      ) : (
        <div className="neon-card border-neon-pink/50 p-3">
          <p className="mb-2 text-center text-sm font-bold">
            Who's scheming? Correct: +{SCORING.ACCUSATION_CORRECT} & their plot burns. Wrong: they profit.
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
        <button className="btn-ghost w-full !text-sm" disabled={offered} onClick={() => setOpen(true)}>
          🤝 {offered ? "Pact offered..." : `Offer a trust pact (+${SCORING.PACT_BONUS} each if you both nail it)`}
        </button>
      ) : (
        <div className="neon-card p-3">
          <p className="mb-2 text-center text-xs text-slate-300">
            If you BOTH put your biggest pile on the true island, +{SCORING.PACT_BONUS} each and an Honour
            Chest. If one of you is wrong... awkward.
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
            <button className="rounded-full border border-white/20 px-3 py-1.5 text-sm" onClick={() => setOpen(false)}>
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
        return { id, pos, avatar: p?.avatar ?? "⛵", name: p?.nickname ?? "?", isCaptain: id === chase.captainId };
      })
      .sort((a, b) => (a.isCaptain ? -1 : b.isCaptain ? 1 : 0));
  }, [chase, game]);

  if (!chase) return null;
  return (
    <div className="neon-card border-neon-cyan/40 p-3">
      <div className="mb-1 flex justify-between text-[11px] font-bold uppercase tracking-wide text-slate-400">
        <span>🌊 The chase — Q{Math.min(chase.questionNumber, chase.totalQuestions)}/{chase.totalQuestions}</span>
        <span>Catch the Captain! ⚓</span>
      </div>
      <div className="relative h-14 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60">
        <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 bg-cyan-400/20" />
        <AnimatePresence>
          {ships.map((ship, i) => (
            <motion.div
              key={ship.id}
              animate={{ left: `${6 + (Math.min(ship.pos, trackLen) / trackLen) * 82}%`, top: ship.isCaptain ? "18%" : `${42 + (i % 3) * 18}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 14 }}
              className="absolute -translate-x-1/2"
            >
              <span className={`text-xl ${ship.isCaptain ? "drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" : ""}`} aria-label={`${ship.name} at position ${ship.pos}`}>
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
