import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { cancel, list, schedule, status } from "./followups.controller";

export const followupsRoutes = Router();

followupsRoutes.use(authMiddleware);
followupsRoutes.post("/schedule", schedule);
followupsRoutes.delete("/:id/cancel", cancel);
followupsRoutes.get("/", list);
followupsRoutes.patch("/:id/status", status);
