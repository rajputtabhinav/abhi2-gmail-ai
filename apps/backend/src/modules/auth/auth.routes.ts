import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { googleCallback, me, redirectToGoogle } from "./auth.controller";

export const authRoutes = Router();

authRoutes.get("/me", authMiddleware, me);
authRoutes.get("/google", authMiddleware, redirectToGoogle);
authRoutes.get("/google/callback", googleCallback);
