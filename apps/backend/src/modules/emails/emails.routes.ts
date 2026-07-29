import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { get, list, metrics } from "./emails.controller";

export const emailsRoutes = Router();

emailsRoutes.use(authMiddleware);
emailsRoutes.get("/", list);
emailsRoutes.get("/metrics/summary", metrics);
emailsRoutes.get("/:id", get);
