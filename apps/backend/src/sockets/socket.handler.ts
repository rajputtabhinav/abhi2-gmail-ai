import type { Server } from "socket.io";
import type { SocketEvents } from "@abhi2/shared";

let io: Server | null = null;

export function setSocketServer(server: Server) {
  io = server;
}

export function emitToUser<K extends keyof SocketEvents>(userId: string, event: K, payload: SocketEvents[K]) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function registerSocketHandlers(server: Server) {
  setSocketServer(server);
  server.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    if (typeof userId === "string" && userId) {
      socket.join(`user:${userId}`);
    }
  });
}
