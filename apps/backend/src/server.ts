import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { registerSocketHandlers } from "./sockets/socket.handler";

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
});

registerSocketHandlers(io);

server.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT}`);
});
