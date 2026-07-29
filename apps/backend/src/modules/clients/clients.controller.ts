import type { Request, Response } from "express";
import { CreateClientSchema, UpdateClientSchema } from "@abhi2/shared";
import { asyncHandler } from "../../utils/async";
import { emitToUser } from "../../sockets/socket.handler";
import { createClient, getClient, listClients, softDeleteClient, updateClient } from "./clients.service";
import { listEmailsForClient } from "../emails/emails.service";
import { listFollowupsForClient } from "../followups/followups.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await listClients(req.user!.id, { status: req.query.status as string, q: req.query.q as string }) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const client = await createClient(req.user!.id, CreateClientSchema.parse(req.body));
  res.status(201).json({ data: client });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await getClient(req.user!.id, String(req.params.id)) });
});

export const patch = asyncHandler(async (req: Request, res: Response) => {
  const client = await updateClient(req.user!.id, String(req.params.id), UpdateClientSchema.parse(req.body));
  if (client?.leadStatus) emitToUser(req.user!.id, "client:status_changed", { clientId: client.id, newStatus: client.leadStatus });
  res.json({ data: client });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await softDeleteClient(req.user!.id, String(req.params.id));
  res.json({ data: { ok: true } });
});

export const emails = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await listEmailsForClient(req.user!.id, String(req.params.id)) });
});

export const followups = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await listFollowupsForClient(req.user!.id, String(req.params.id)) });
});
