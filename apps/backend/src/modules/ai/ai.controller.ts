import type { Request, Response } from "express";
import { DetectIntentSchema, GenerateReplySchema, ProcessEmailSchema } from "@abhi2/shared";
import { asyncHandler } from "../../utils/async";
import { detectIntent, generateReply, processIncomingEmail } from "./ai.service";

export const detect = asyncHandler(async (req: Request, res: Response) => {
  const { emailBody } = DetectIntentSchema.parse(req.body);
  res.json({ data: await detectIntent(emailBody) });
});

export const generate = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: { reply: await generateReply(GenerateReplySchema.parse(req.body)) } });
});

export const process = asyncHandler(async (req: Request, res: Response) => {
  const { emailId } = ProcessEmailSchema.parse(req.body);
  res.json({ data: await processIncomingEmail(req.user!.id, emailId) });
});
