import type { Server, Socket } from "socket.io";
import { isValidRoomCode, type GameConfig } from "@treasure-trap/shared";
import {
  accuse,
  acceptPact,
  configureGame,
  forceChest,
  hostAdvance,
  offerPact,
  openChestForPlayer,
  privateState,
  publicState,
  resetToLobby,
  setEmitter,
  setupMission,
  skipTimer,
  startGame,
  submitAnswer,
  submitBid,
  submitFinalAction,
  submitPairChoice,
  useItem,
  uid,
  type ServerRoom,
} from "./engine.js";
import { createNewRoom, getRoom, joinRoom } from "./roomManager.js";
import { botName, runBotsForPhase } from "./bots.js";
import { createPlayer, nextAvatar } from "./state.js";

type SocketData = {
  roomCode?: string;
  playerId?: string;
};

const DEBUG_ENABLED = process.env.NODE_ENV !== "production" || process.env.ALLOW_DEBUG === "1";

export function attachSockets(io: Server): void {
  setEmitter({
    broadcast: (room) => broadcastRoom(io, room),
    toPlayer: (room, playerId, event, payload) => {
      const player = room.players.get(playerId);
      if (player?.socketId) io.to(player.socketId).emit(event, payload);
    },
    toast: (room, playerId, msg) => {
      if (playerId) {
        const player = room.players.get(playerId);
        if (player?.socketId) io.to(player.socketId).emit("toast", msg);
      } else {
        io.to(room.code).emit("toast", msg);
      }
    },
    onBotPhase: (room) => runBotsForPhase(room),
  });

  io.on("connection", (socket: Socket) => {
    const data = socket.data as SocketData;

    const currentRoom = (): ServerRoom | undefined =>
      data.roomCode ? getRoom(data.roomCode) : undefined;
    const currentPlayerId = (): string | undefined => data.playerId;

    socket.on("room:create", (nickname: unknown, cb: unknown) => {
      if (typeof cb !== "function") return;
      const name = typeof nickname === "string" ? nickname.trim() : "";
      if (!name) return cb({ ok: false, error: "Every pirate needs a name!" });
      const { room, player } = createNewRoom(name);
      player.socketId = socket.id;
      data.roomCode = room.code;
      data.playerId = player.id;
      socket.join(room.code);
      cb({ ok: true, data: { roomCode: room.code, playerId: player.id } });
      broadcastRoom(io, room);
    });

    socket.on("room:join", (roomCode: unknown, nickname: unknown, cb: unknown) => {
      if (typeof cb !== "function") return;
      const code = typeof roomCode === "string" ? roomCode.trim().toUpperCase() : "";
      const name = typeof nickname === "string" ? nickname.trim() : "";
      if (!isValidRoomCode(code))
        return cb({ ok: false, error: "That room code doesn't look right." });
      if (!name) return cb({ ok: false, error: "Every pirate needs a name!" });
      const result = joinRoom(code, name);
      if ("error" in result) return cb({ ok: false, error: result.error });
      result.player.socketId = socket.id;
      data.roomCode = result.room.code;
      data.playerId = result.player.id;
      socket.join(result.room.code);
      cb({ ok: true, data: { roomCode: result.room.code, playerId: result.player.id } });
      broadcastRoom(io, result.room);
    });

    socket.on("room:rejoin", (roomCode: unknown, playerId: unknown, cb: unknown) => {
      if (typeof cb !== "function") return;
      const code = typeof roomCode === "string" ? roomCode.trim().toUpperCase() : "";
      const room = getRoom(code);
      const player = room?.players.get(typeof playerId === "string" ? playerId : "");
      if (!room || !player) return cb({ ok: false, error: "Couldn't rejoin that voyage." });
      player.socketId = socket.id;
      player.connected = true;
      data.roomCode = room.code;
      data.playerId = player.id;
      socket.join(room.code);
      cb({ ok: true, data: { ok: true } });
      broadcastRoom(io, room);
    });

    socket.on("game:configure", (config: unknown) => {
      const room = currentRoom();
      if (!room || currentPlayerId() !== room.hostId) return;
      if (room.phase !== "lobby" && room.phase !== "setup") return;
      const c = config as GameConfig;
      if (!c || !["short", "medium", "full"].includes(c.length)) return;
      configureGame(room, { length: c.length, rounds: Array.isArray(c.rounds) ? c.rounds : [] });
    });

    socket.on("game:start", () => {
      const room = currentRoom();
      if (!room || currentPlayerId() !== room.hostId) return;
      if (room.phase !== "lobby" && room.phase !== "setup") return;
      if (room.players.size < 2) {
        socket.emit("error", "You need at least 2 pirates (add a bot from the playtest panel!)");
        return;
      }
      startGame(room);
    });

    socket.on("game:playAgain", () => {
      const room = currentRoom();
      if (!room || currentPlayerId() !== room.hostId) return;
      if (room.phase !== "winner") return;
      resetToLobby(room);
    });

    socket.on("answer:submit", (payload: unknown) => {
      const room = currentRoom();
      const pid = currentPlayerId();
      if (!room || !pid) return;
      const p = payload as { choiceIndex?: number; lootAllocation?: number[]; confident?: boolean };
      submitAnswer(room, pid, p ?? {});
    });

    socket.on("loot:allocate", (allocation: unknown) => {
      const room = currentRoom();
      const pid = currentPlayerId();
      if (!room || !pid || !Array.isArray(allocation)) return;
      submitAnswer(room, pid, { lootAllocation: allocation as number[] });
    });

    socket.on("item:use", (payload: unknown) => {
      const room = currentRoom();
      const pid = currentPlayerId();
      if (!room || !pid) return;
      const p = payload as { uid: string; targetId?: string; optionIndex?: number };
      if (!p?.uid) return;
      useItem(room, pid, p);
    });

    socket.on("chest:open", (chestUid: unknown) => {
      const room = currentRoom();
      const pid = currentPlayerId();
      if (!room || !pid || typeof chestUid !== "string") return;
      openChestForPlayer(room, pid, chestUid);
    });

    socket.on("auction:bid", (amount: unknown) => {
      const room = currentRoom();
      const pid = currentPlayerId();
      if (!room || !pid || typeof amount !== "number") return;
      submitBid(room, pid, amount);
    });

    socket.on("pact:offer", (targetId: unknown) => {
      const room = currentRoom();
      const pid = currentPlayerId();
      if (!room || !pid || typeof targetId !== "string") return;
      offerPact(room, pid, targetId);
    });

    socket.on("pact:accept", (fromId: unknown) => {
      const room = currentRoom();
      const pid = currentPlayerId();
      if (!room || !pid || typeof fromId !== "string") return;
      acceptPact(room, pid, fromId);
    });

    socket.on("mutiny:accuse", (targetId: unknown) => {
      const room = currentRoom();
      const pid = currentPlayerId();
      if (!room || !pid || typeof targetId !== "string") return;
      accuse(room, pid, targetId);
    });

    socket.on("mission:setup", (payload: unknown) => {
      const room = currentRoom();
      const pid = currentPlayerId();
      if (!room || !pid) return;
      setupMission(room, pid, (payload ?? {}) as { targetId?: string; optionIndex?: number });
    });

    socket.on("pair:choose", (choice: unknown) => {
      const room = currentRoom();
      const pid = currentPlayerId();
      if (!room || !pid) return;
      if (choice !== "split" && choice !== "plunder" && choice !== "guard") return;
      submitPairChoice(room, pid, choice);
    });

    socket.on("final:action", (payload: unknown) => {
      const room = currentRoom();
      const pid = currentPlayerId();
      if (!room || !pid) return;
      const p = payload as { actionId: string; targetId?: string };
      if (!p?.actionId) return;
      submitFinalAction(room, pid, p as Parameters<typeof submitFinalAction>[2]);
    });

    socket.on("phase:advance", () => {
      const room = currentRoom();
      const pid = currentPlayerId();
      if (!room || !pid) return;
      hostAdvance(room, pid);
    });

    // ----- Debug / playtest (dev only) ------------------------------------

    socket.on("debug:addBot", () => {
      const room = currentRoom();
      if (!room || !DEBUG_ENABLED) return;
      if (room.players.size >= 8) return;
      const botCount = [...room.players.values()].filter((p) => p.isBot).length;
      const bot = createPlayer(uid("bot"), botName(botCount), { isBot: true });
      bot.avatar = nextAvatar(room);
      room.players.set(bot.id, bot);
      broadcastRoom(io, room);
      runBotsForPhase(room);
    });

    socket.on("debug:skipTimer", () => {
      const room = currentRoom();
      if (!room || !DEBUG_ENABLED) return;
      skipTimer(room);
    });

    socket.on("debug:forceChest", () => {
      const room = currentRoom();
      const pid = currentPlayerId();
      if (!room || !pid || !DEBUG_ENABLED) return;
      forceChest(room, pid);
    });

    socket.on("debug:reset", () => {
      const room = currentRoom();
      if (!room || !DEBUG_ENABLED) return;
      resetToLobby(room);
    });

    socket.on("debug:autoAnswer", () => {
      const room = currentRoom();
      if (!room || !DEBUG_ENABLED || room.phase !== "question") return;
      const optionCount =
        room.currentQuestion?.options.length ?? room.currentObscure?.options.length ?? 4;
      for (const p of room.players.values()) {
        if (room.answers.has(p.id)) continue;
        const round = room.roundPlan[room.roundIndex];
        if (round === "lootDrop") {
          const alloc = [0, 0, 0, 0];
          alloc[Math.floor(Math.random() * 4)] = 100;
          submitAnswer(room, p.id, { lootAllocation: alloc });
        } else {
          submitAnswer(room, p.id, { choiceIndex: Math.floor(Math.random() * optionCount) });
        }
      }
    });

    socket.on("debug:getState", (cb: unknown) => {
      const room = currentRoom();
      if (!room || !DEBUG_ENABLED || typeof cb !== "function") return;
      cb(
        JSON.parse(
          JSON.stringify({
            ...publicState(room),
            _server: {
              answers: [...room.answers.entries()],
              effects: room.effects,
              correctIndex: room.currentQuestion?.correctIndex,
              missions: [...room.players.values()].map((p) => ({
                id: p.nickname,
                mission: p.mission,
              })),
            },
          }),
        ),
      );
    });

    socket.on("disconnect", () => {
      const room = currentRoom();
      const pid = currentPlayerId();
      if (!room || !pid) return;
      const player = room.players.get(pid);
      if (!player) return;
      player.connected = false;
      player.socketId = undefined;
      if (room.phase === "lobby" || room.phase === "setup") {
        room.players.delete(pid);
      }
      // Host migration: pass the wheel to the first connected human, or any bot.
      if (room.hostId === pid) {
        const nextHost =
          [...room.players.values()].find((p) => p.connected && !p.isBot) ??
          [...room.players.values()].find((p) => p.connected);
        if (nextHost) {
          room.hostId = nextHost.id;
          io.to(room.code).emit("toast", {
            icon: "🫡",
            text: `${nextHost.nickname} is now the host.`,
          });
        }
      }
      broadcastRoom(io, room);
    });
  });
}

function broadcastRoom(io: Server, room: ServerRoom): void {
  const state = publicState(room);
  io.to(room.code).emit("game:state", state);
  for (const player of room.players.values()) {
    if (player.socketId) {
      io.to(player.socketId).emit("player:privateState", privateState(room, player));
    }
  }
}
