import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async";
import { dashboardSummary, getEmail, listEmails } from "./emails.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await listEmails(req.user!.id) });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await getEmail(req.user!.id, String(req.params.id)) });
});

export const metrics = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await dashboardSummary(req.user!.id) });
});
