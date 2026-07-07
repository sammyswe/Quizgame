import http from "node:http";
import express from "express";
import { Server } from "socket.io";
import { attachSockets } from "./sockets.js";
import { allRooms } from "./roomManager.js";

const PORT = Number(process.env.PORT ?? 3001);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";

const app = express();

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    name: "treasure-trap-server",
    rooms: allRooms().size,
    uptime: process.uptime(),
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN === "*" ? "*" : CORS_ORIGIN.split(","),
    methods: ["GET", "POST"],
  },
});

attachSockets(io);

server.listen(PORT, () => {
  console.log(`🏴‍☠️ Treasure Trap server sailing on port ${PORT}`);
});
