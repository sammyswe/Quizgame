/**
 * Headless simulation of a full arcade game: 1 human-ish host client + 2 bots,
 * 10 regular questions plus Million Pound Drop. Exercises answers,
 * mutiny, power-ups (via debug chests), and asserts the game reaches a winner.
 *
 * Usage: node scripts/simulate-arcade.mjs   (server must be running on :3001)
 */
import { createRequire } from "node:module";

// Resolve socket.io-client from the client workspace.
const require = createRequire(new URL("../client/package.json", import.meta.url));
const { io } = require("socket.io-client");

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001";
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

function connect() {
  return io(SERVER_URL, { transports: ["websocket"] });
}

function emitAck(socket, event, ...args) {
  return new Promise((resolve) => socket.emit(event, ...args, resolve));
}

const host = connect();
let phase = "";
let lastState;
let lastPrivateState;
let resultCount = 0;
let chestCount = 0;
let sawEventRound = false;
let sawMaroonOrMutinyOrSea = [];

const timeout = setTimeout(() => {
  console.error("❌ TIMEOUT: game did not finish in 5 minutes");
  process.exit(1);
}, 300_000);

host.on("connect", async () => {
  log("host connected");
  const res = await emitAck(host, "room:create", "Sim Captain");
  if (!res.ok) throw new Error(res.error);
  log("room", res.data.roomCode);

  // 3-player test game: host + 2 bots.
  host.emit("debug:addBot");
  host.emit("debug:addBot");
  host.emit("game:configure", { length: "test", rounds: [] });
  setTimeout(() => host.emit("game:start"), 500);
});

host.on("question:result", (r) => {
  resultCount += 1;
  log(
    `  result: ${r.correct ? "CORRECT" : "wrong"} +${r.earned} (pot ${r.potAtLock}, streak ${r.streak}${r.mutiny ? `, mutiny ${r.mutiny}` : ""}${r.marooned ? ", MAROONED" : ""}${r.jackpot ? ", JACKPOT" : ""})`,
  );
});

host.on("chest:opened", (c) => {
  chestCount += 1;
  log(`  chest opened: ${c.rarity} → ${c.powerUpDef.name}${c.jackpot ? " (JACKPOT)" : ""}`);
});

host.on("toast", (t) => log(`  toast: ${t.icon ?? ""} ${t.text}`));

host.on("game:state", (state) => {
  lastState = state;
  if (state.phase !== phase) {
    phase = state.phase;
    const a = state.arcade;
    log(
      `phase=${phase}` +
        (a ? ` round ${a.roundNumber}/${a.totalRounds}${a.isEventRound ? " ⚡EVENT" : ""}` : ""),
    );
    if (a?.isEventRound && phase === "question") sawEventRound = true;

    if (phase === "question") {
      const a2 = state.arcade;
      setTimeout(() => {
        if (a2?.isEventRound) {
          const alloc = [0, 0, 0, 0];
          alloc[Math.floor(Math.random() * 4)] = lastPrivateState?.lootDropPool ?? 0;
          host.emit("answer:submit", { lootAllocation: alloc });
          log("  host allocated MPD gold");
        } else {
          // Mutiny sometimes (host is often leader → server rejects, that's fine)
          if (Math.random() < 0.4) host.emit("mutiny:declare");
          host.emit("answer:submit", { choiceIndex: Math.floor(Math.random() * 4) });
          log("  host answered");
        }
      }, 800 + Math.random() * 1500);
      // Occasionally grab a debug chest and open it to exercise power-ups.
      if (Math.random() < 0.4) {
        host.emit("debug:forceChest");
        setTimeout(async () => {
          const s = await emitAck(host, "debug:getState");
          void s;
        }, 300);
      }
    }
    if (phase === "reveal") {
      for (const e of state.revealEvents) {
        log(`  reveal: ${e.icon ?? ""} ${e.title}`);
        if (/MAROONED|MUTINY|KRAKEN|DOLPHIN|POSEIDON/i.test(e.title)) {
          sawMaroonOrMutinyOrSea.push(e.title);
        }
      }
    }
    if (phase === "winner") {
      clearTimeout(timeout);
      const winner = state.players.find((p) => p.id === state.winnerId);
      log(`🏆 WINNER: ${winner?.nickname} with ${winner?.score} gold`);
      log(`   results received: ${resultCount}, chests opened: ${chestCount}`);
      log(`   event round played: ${sawEventRound}`);
      log(`   drama seen: ${[...new Set(sawMaroonOrMutinyOrSea)].join(" | ") || "(none this run)"}`);
      const ok = sawEventRound && resultCount >= 11;
      console.log(ok ? "✅ SIMULATION PASSED" : "❌ SIMULATION FAILED");
      process.exit(ok ? 0 : 1);
    }
  }
});

// Open any chests we earn so power-ups flow.
setInterval(() => {
  if (!lastState || phase === "reveal") return;
  host.emit("debug:getState", () => {});
}, 5000);

host.on("player:privateState", (priv) => {
  lastPrivateState = priv;
  if (priv.chests.length > 0 && phase !== "reveal") {
    host.emit("chest:open", priv.chests[0].uid);
  }
});
