import type { Request, Response } from "express";
import { env } from "../../config/env";
import { asyncHandler } from "../../utils/async";
import { getCurrentUser, getGoogleAuthUrl, handleGoogleCallback } from "./auth.service";

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getCurrentUser(req.user!.id);
  res.json({ data: user });
});

export const redirectToGoogle = asyncHandler(async (_req: Request, res: Response) => {
  res.redirect(getGoogleAuthUrl());
});

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const code = String(req.query.code ?? "");
  await handleGoogleCallback(code);
  res.redirect(`${env.FRONTEND_URL}/settings?gmail=connected`);
});
