"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(userId?: string | null) {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000", {
      withCredentials: true,
      auth: userId ? { userId } : undefined,
      autoConnect: false,
    });
  }
  if (userId) socket.auth = { userId };
  return socket;
}
