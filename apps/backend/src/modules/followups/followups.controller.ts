import type { Request, Response } from "express";
import { ScheduleFollowupsSchema, UpdateFollowupStatusSchema } from "@abhi2/shared";
import { asyncHandler } from "../../utils/async";
import { cancelFollowup, listFollowups, scheduleFollowups, updateFollowupStatus } from "./followups.service";

export const schedule = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await scheduleFollowups(req.user!.id, ScheduleFollowupsSchema.parse(req.body)) });
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await cancelFollowup(req.user!.id, String(req.params.id)) });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await listFollowups(req.user!.id) });
});

export const status = asyncHandler(async (req: Request, res: Response) => {
  const { status: nextStatus } = UpdateFollowupStatusSchema.parse(req.body);
  res.json({ data: await updateFollowupStatus(req.user!.id, String(req.params.id), nextStatus) });
});
