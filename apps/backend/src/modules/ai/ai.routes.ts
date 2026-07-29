import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { detect, generate, process } from "./ai.controller";

export const aiRoutes = Router();

aiRoutes.use(authMiddleware);
aiRoutes.post("/detect-intent", detect);
aiRoutes.post("/generate-reply", generate);
aiRoutes.post("/process-email", process);
