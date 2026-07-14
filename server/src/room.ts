import type { Server } from "socket.io";
import {
  ALLOCATION_SECONDS,
  ISLAND_COUNT,
  LOOT_PER_QUESTION,
  QUESTIONS_PER_GAME,
  allocationsValid,
  emptyAllocations,
  type ClientToServerEvents,
  type Phase,
  type RevealPayload,
  type RoomStatePublic,
  type ServerToClientEvents,
} from "../../shared/src/types.js";
import { pickQuestions, type Question } from "./questions.js";

const REVEAL_MS = 16_000;
const BOT_NAMES = ["Salty Sam", "One-Eye Olga", "Barnacle Bob", "Gunpowder Gwen", "Kraken Kev", "Mad Mango"];

type IO = Server<ClientToServerEvents, ServerToClientEvents>;

interface Player {
  id: string;
  nickname: string;
  avatarId: number;
  score: number;
  lockedIn: boolean;
  connected: boolean;
  isBot: boolean;
  allocations: number[];
  usedFearShot: boolean;
  scared: boolean;
}

export class GameRoom {
  readonly code: string;
  hostId: string;
  phase: Phase = "lobby";
  private players = new Map<string, Player>();
  private questions: Question[] = [];
  private questionIndex = -1;
  private endsAt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private botTimers: ReturnType<typeof setTimeout>[] = [];

  constructor(private io: IO, code: string, hostId: string) {
    this.code = code;
    this.hostId = hostId;
  }

  get size(): number {
    return this.players.size;
  }

  addPlayer(id: string, nickname: string, isBot = false): void {
    this.players.set(id, {
      id,
      nickname,
      avatarId: this.players.size % 8,
      score: 0,
      lockedIn: false,
      connected: true,
      isBot,
      allocations: emptyAllocations(),
      usedFearShot: false,
      scared: false,
    });
    this.broadcast();
  }

  removePlayer(id: string): void {
    const p = this.players.get(id);
    if (!p) return;
    if (this.phase === "lobby") {
      this.players.delete(id);
    } else {
      p.connected = false;
    }
    if (id === this.hostId) {
      const next = [...this.players.values()].find((pl) => pl.connected && !pl.isBot);
      if (next) this.hostId = next.id;
    }
    this.maybeReveal();
    this.broadcast();
  }

  hasConnectedHumans(): boolean {
    return [...this.players.values()].some((p) => p.connected && !p.isBot);
  }

  addBot(): void {
    const id = `bot-${Math.random().toString(36).slice(2, 8)}`;
    const name = BOT_NAMES[this.players.size % BOT_NAMES.length];
    this.addPlayer(id, name, true);
    if (this.phase === "allocating") this.scheduleBot(this.players.get(id)!);
  }

  startGame(byId: string): void {
    if (byId !== this.hostId) return;
    if (this.phase !== "lobby" && this.phase !== "gameOver") return;
    this.questions = pickQuestions(QUESTIONS_PER_GAME);
    this.questionIndex = -1;
    for (const p of this.players.values()) p.score = 0;
    this.nextQuestion();
  }

  setAllocations(id: string, allocations: number[]): void {
    const p = this.players.get(id);
    if (!p || this.phase !== "allocating" || p.lockedIn) return;
    if (!allocationsValid(allocations)) return;
    p.allocations = [...allocations];
    this.broadcast();
  }

  lockIn(id: string): void {
    const p = this.players.get(id);
    if (!p || this.phase !== "allocating" || p.lockedIn) return;
    p.lockedIn = true;
    this.maybeReveal();
    this.broadcast();
  }

  resetAllocations(id: string): void {
    const p = this.players.get(id);
    if (!p || this.phase !== "allocating" || p.lockedIn) return;
    p.allocations = emptyAllocations();
    this.broadcast();
  }

  useFearShot(fromId: string, targetId: string): void {
    const from = this.players.get(fromId);
    const target = this.players.get(targetId);
    if (!from || !target || from.usedFearShot || fromId === targetId) return;
    if (this.phase !== "allocating") return;
    from.usedFearShot = true;
    target.scared = true;
    this.io.to(this.code).emit("item", { type: "fearShot", fromId, targetId });
    this.broadcast();
    setTimeout(() => {
      target.scared = false;
      this.broadcast();
    }, 10_000);
  }

  grantItem(id: string): void {
    const p = this.players.get(id);
    if (!p) return;
    p.usedFearShot = false;
    this.broadcast();
  }

  skipTimer(): void {
    if (this.phase !== "allocating") return;
    this.endsAt = Date.now() + 3_000;
    this.armTimer(3_000);
    this.broadcast();
  }

  forceReveal(): void {
    if (this.phase !== "allocating") return;
    this.reveal();
  }

  destroy(): void {
    if (this.timer) clearTimeout(this.timer);
    for (const t of this.botTimers) clearTimeout(t);
  }

  // ---------------------------------------------------------------- private

  private nextQuestion(): void {
    this.questionIndex += 1;
    if (this.questionIndex >= this.questions.length) {
      this.phase = "gameOver";
      this.broadcast();
      return;
    }
    this.phase = "allocating";
    this.endsAt = Date.now() + ALLOCATION_SECONDS * 1_000;
    for (const p of this.players.values()) {
      p.lockedIn = false;
      p.allocations = emptyAllocations();
      p.usedFearShot = false;
      p.scared = false;
      if (p.isBot) this.scheduleBot(p);
    }
    this.armTimer(ALLOCATION_SECONDS * 1_000);
    this.broadcast();
  }

  private scheduleBot(bot: Player): void {
    const delay = 3_000 + Math.random() * 8_000;
    this.botTimers.push(
      setTimeout(() => {
        if (this.phase !== "allocating" || bot.lockedIn) return;
        const alloc = emptyAllocations();
        let remaining = LOOT_PER_QUESTION;
        while (remaining > 0) {
          alloc[Math.floor(Math.random() * ISLAND_COUNT)] += 10;
          remaining -= 10;
        }
        bot.allocations = alloc;
        bot.lockedIn = true;
        this.maybeReveal();
        this.broadcast();
      }, delay),
    );
  }

  private armTimer(ms: number): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.reveal(), ms);
  }

  private maybeReveal(): void {
    if (this.phase !== "allocating") return;
    const active = [...this.players.values()].filter((p) => p.connected);
    if (active.length > 0 && active.every((p) => p.lockedIn)) this.reveal();
  }

  private reveal(): void {
    if (this.phase !== "allocating") return;
    if (this.timer) clearTimeout(this.timer);
    this.phase = "reveal";

    const q = this.questions[this.questionIndex];
    const islandTotals = emptyAllocations();
    const payload: RevealPayload = {
      correctIndex: q.correctIndex,
      results: [],
      leaderboard: [],
      islandTotals,
    };

    for (const p of this.players.values()) {
      for (let i = 0; i < ISLAND_COUNT; i++) islandTotals[i] += p.allocations[i];
      const onCorrect = p.allocations[q.correctIndex];
      const gained = onCorrect * 2;
      const lost = p.allocations.reduce((a, b) => a + b, 0) - onCorrect;
      p.score += gained;
      payload.results.push({
        playerId: p.id,
        allocations: [...p.allocations],
        gained,
        lost,
        newScore: p.score,
      });
    }

    payload.leaderboard = [...this.players.values()]
      .map((p) => ({ playerId: p.id, nickname: p.nickname, score: p.score }))
      .sort((a, b) => b.score - a.score);

    this.io.to(this.code).emit("reveal", payload);
    this.broadcast();
    this.timer = setTimeout(() => this.nextQuestion(), REVEAL_MS);
  }

  private broadcast(): void {
    this.io.to(this.code).emit("state", this.publicState());
  }

  publicState(): RoomStatePublic {
    const q = this.questionIndex >= 0 && this.questionIndex < this.questions.length
      ? this.questions[this.questionIndex]
      : null;
    return {
      code: this.code,
      phase: this.phase,
      hostId: this.hostId,
      players: [...this.players.values()].map((p) => ({
        id: p.id,
        nickname: p.nickname,
        avatarId: p.avatarId,
        score: p.score,
        lockedIn: p.lockedIn,
        connected: p.connected,
        isBot: p.isBot,
        isHost: p.id === this.hostId,
        allocationTotal: p.allocations.reduce((a, b) => a + b, 0),
        flagIsland: p.lockedIn ? this.flagIsland(p) : null,
        scared: p.scared,
        hasItem: !p.usedFearShot,
      })),
      question:
        q && (this.phase === "allocating" || this.phase === "reveal")
          ? {
              index: this.questionIndex,
              total: this.questions.length,
              text: q.text,
              options: q.options,
              endsAt: this.endsAt,
            }
          : null,
    };
  }

  private flagIsland(p: Player): number | null {
    let best = -1;
    let bestVal = 0;
    p.allocations.forEach((v, i) => {
      if (v > bestVal) {
        bestVal = v;
        best = i;
      }
    });
    return best >= 0 ? best : null;
  }
}
