import { createServer } from "node:http";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "../../shared/src/types.js";
import { GameRoom } from "./room.js";

const PORT = Number(process.env.PORT ?? 3001);

const httpServer = createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("Treasure Trap server up. Connect with the client app.\n");
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: true },
});

const rooms = new Map<string, GameRoom>();
/** socket.id -> room code */
const socketRoom = new Map<string, string>();

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function sanitizeNickname(raw: unknown): string {
  const name = String(raw ?? "").trim().slice(0, 16);
  return name.length > 0 ? name : "Pirate";
}

io.on("connection", (socket) => {
  const getRoom = (): GameRoom | undefined => {
    const code = socketRoom.get(socket.id);
    return code ? rooms.get(code) : undefined;
  };

  socket.on("room:create", (nickname, cb) => {
    if (typeof cb !== "function") return;
    const code = makeCode();
    const room = new GameRoom(io, code, socket.id);
    rooms.set(code, room);
    socketRoom.set(socket.id, code);
    socket.join(code);
    room.addPlayer(socket.id, sanitizeNickname(nickname));
    cb({ ok: true, playerId: socket.id, code, state: room.publicState() });
  });

  socket.on("room:join", (code, nickname, cb) => {
    if (typeof cb !== "function") return;
    const room = rooms.get(String(code ?? "").trim().toUpperCase());
    if (!room) {
      cb({ ok: false, error: "Room not found. Check the code." });
      return;
    }
    if (room.size >= 8) {
      cb({ ok: false, error: "Room is full (8 players max)." });
      return;
    }
    socketRoom.set(socket.id, room.code);
    socket.join(room.code);
    room.addPlayer(socket.id, sanitizeNickname(nickname));
    cb({ ok: true, playerId: socket.id, code: room.code, state: room.publicState() });
  });

  socket.on("game:start", () => getRoom()?.startGame(socket.id));
  socket.on("game:again", () => getRoom()?.startGame(socket.id));
  socket.on("loot:set", (allocations) => getRoom()?.setAllocations(socket.id, allocations));
  socket.on("loot:lock", () => getRoom()?.lockIn(socket.id));
  socket.on("loot:reset", () => getRoom()?.resetAllocations(socket.id));
  socket.on("item:fearShot", (targetId) => getRoom()?.useFearShot(socket.id, String(targetId)));
  socket.on("debug:addBot", () => getRoom()?.addBot());
  socket.on("debug:skipTimer", () => getRoom()?.skipTimer());
  socket.on("debug:forceReveal", () => getRoom()?.forceReveal());
  socket.on("debug:grantItem", () => getRoom()?.grantItem(socket.id));

  socket.on("disconnect", () => {
    const room = getRoom();
    socketRoom.delete(socket.id);
    if (!room) return;
    room.removePlayer(socket.id);
    if (!room.hasConnectedHumans()) {
      room.destroy();
      rooms.delete(room.code);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[treasure-trap] server listening on http://localhost:${PORT}`);
});
