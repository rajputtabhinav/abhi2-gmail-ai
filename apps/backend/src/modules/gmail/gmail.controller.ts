import type { Request, Response } from "express";
import { ReplyEmailSchema, SendEmailSchema } from "@abhi2/shared";
import { asyncHandler } from "../../utils/async";
import { logger } from "../../utils/logger";
import { getEmailQueue } from "../../queues/emailQueue";
import { emitToUser } from "../../sockets/socket.handler";
import { getInbox, getThread, processPubSubGmailNotification, replyToEmail, watchInbox } from "./gmail.service";

export const inbox = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await getInbox(req.user!.id, Number(req.query.maxResults ?? 50)) });
});

export const thread = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await getThread(req.user!.id, String(req.params.threadId)) });
});

export const send = asyncHandler(async (req: Request, res: Response) => {
  const body = SendEmailSchema.parse(req.body);
  const job = await getEmailQueue().add("send", {
    userId: req.user!.id,
    to: body.to,
    subject: body.subject,
    body: body.body,
    clientId: body.clientId ?? null,
    templateType: body.templateType ?? null,
  });
  res.status(202).json({ data: { queued: true, jobId: job.id } });
});

export const reply = asyncHandler(async (req: Request, res: Response) => {
  const input = ReplyEmailSchema.parse(req.body);
  const result = await replyToEmail(req.user!.id, input);
  emitToUser(req.user!.id, "email:replied", { emailId: input.emailId, replyId: result.replyId ?? "" });
  res.status(201).json({ data: result });
});

export const watch = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await watchInbox(req.user!.id) });
});

export const webhook = asyncHandler(async (req: Request, res: Response) => {
  try {
    await processPubSubGmailNotification(req.body as { message?: { data?: string } });
  } catch (error) {
    logger.error("Gmail Pub/Sub webhook failed", { error });
  }
  res.status(204).send();
});
