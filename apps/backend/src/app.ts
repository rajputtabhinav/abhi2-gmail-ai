import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { csrfMiddleware } from "./middleware/auth.middleware";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware";
import { authRoutes } from "./modules/auth/auth.routes";
import { gmailRoutes } from "./modules/gmail/gmail.routes";
import { clientsRoutes } from "./modules/clients/clients.routes";
import { emailsRoutes } from "./modules/emails/emails.routes";
import { aiRoutes } from "./modules/ai/ai.routes";
import { followupsRoutes } from "./modules/followups/followups.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: true, legacyHeaders: false }));
  app.use(csrfMiddleware);

  app.get("/health", (_req, res) => res.json({ data: { ok: true } }));
  app.use("/api/auth", authRoutes);
  app.use("/api/gmail", gmailRoutes);
  app.use("/api/clients", clientsRoutes);
  app.use("/api/emails", emailsRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/followups", followupsRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
