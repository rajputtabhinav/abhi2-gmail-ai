import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { inbox, reply, send, thread, watch, webhook } from "./gmail.controller";

export const gmailRoutes = Router();

gmailRoutes.post("/webhook", webhook);
gmailRoutes.use(authMiddleware);
gmailRoutes.get("/inbox", inbox);
gmailRoutes.get("/thread/:threadId", thread);
gmailRoutes.post("/send", send);
gmailRoutes.post("/reply", reply);
gmailRoutes.post("/watch", watch);
