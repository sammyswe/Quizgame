import { io, type Socket } from "socket.io-client";

/**
 * Single socket connection. In local dev the Vite proxy forwards /socket.io
 * to localhost:3001; in production set VITE_SERVER_URL to the server host.
 */
const SERVER_URL = import.meta.env.VITE_SERVER_URL as string | undefined;

export const socket: Socket = io(SERVER_URL || "/", {
  transports: ["websocket", "polling"],
  autoConnect: true,
});

export function emitWithAck<T>(event: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve) => {
    socket.emit(event, ...args, (res: T) => resolve(res));
  });
}
