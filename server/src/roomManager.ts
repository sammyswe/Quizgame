import { generateRoomCode } from "@treasure-trap/shared";
import { createPlayer, createRoom, nextAvatar, type ServerPlayer, type ServerRoom } from "./state.js";
import { uid } from "./engine.js";

const rooms = new Map<string, ServerRoom>();

const MAX_PLAYERS = 8;
const ROOM_TTL_MS = 1000 * 60 * 60 * 3; // 3 hours

export function getRoom(code: string): ServerRoom | undefined {
  return rooms.get(code.toUpperCase());
}

export function createNewRoom(nickname: string): { room: ServerRoom; player: ServerPlayer } {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();
  const player = createPlayer(uid("p"), nickname, { isHost: true });
  const room = createRoom(code, player);
  player.avatar = nextAvatar(room);
  rooms.set(code, room);
  return { room, player };
}

export function joinRoom(
  code: string,
  nickname: string,
): { room: ServerRoom; player: ServerPlayer } | { error: string } {
  const room = getRoom(code);
  if (!room) return { error: "No voyage found with that code. Check the map!" };
  if (room.players.size >= MAX_PLAYERS) return { error: "The crew is full — 8 pirates max." };
  if (room.phase !== "lobby" && room.phase !== "setup") {
    return { error: "This voyage already set sail. Ask the host for a fresh room." };
  }
  const clean = nickname.trim().slice(0, 16) || "Nameless Pirate";
  const taken = [...room.players.values()].some(
    (p) => p.nickname.toLowerCase() === clean.toLowerCase(),
  );
  const finalName = taken ? `${clean} II` : clean;
  const player = createPlayer(uid("p"), finalName);
  player.avatar = nextAvatar(room);
  room.players.set(player.id, player);
  return { room, player };
}

export function removeRoom(code: string): void {
  const room = rooms.get(code);
  if (room?.timer) clearTimeout(room.timer);
  rooms.delete(code);
}

export function allRooms(): Map<string, ServerRoom> {
  return rooms;
}

/** Periodic cleanup of abandoned rooms. */
setInterval(
  () => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      const anyConnected = [...room.players.values()].some((p) => p.connected && !p.isBot);
      if (!anyConnected && now - room.createdAt > ROOM_TTL_MS) {
        removeRoom(code);
      }
    }
  },
  1000 * 60 * 10,
).unref();
