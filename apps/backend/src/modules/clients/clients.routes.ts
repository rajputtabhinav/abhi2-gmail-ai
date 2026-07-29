import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { create, emails, followups, get, list, patch, remove } from "./clients.controller";

export const clientsRoutes = Router();

clientsRoutes.use(authMiddleware);
clientsRoutes.get("/", list);
clientsRoutes.post("/", create);
clientsRoutes.get("/:id", get);
clientsRoutes.patch("/:id", patch);
clientsRoutes.delete("/:id", remove);
clientsRoutes.get("/:id/emails", emails);
clientsRoutes.get("/:id/followups", followups);
