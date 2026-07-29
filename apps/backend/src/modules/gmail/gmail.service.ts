import { google } from "googleapis";
import { randomUUID } from "crypto";
import { query } from "../../config/db";
import { env } from "../../config/env";
import { decryptToken, encryptToken } from "../../utils/crypto";
import { buildMimeEmail, parseGmailMessage } from "../../utils/gmail.helper";
import { logger } from "../../utils/logger";
import { emitToUser } from "../../sockets/socket.handler";
import { getAiQueue } from "../../queues/aiQueue";
import { createClient } from "../clients/clients.service";
import { upsertEmail } from "../emails/emails.service";
import { getOAuthClient } from "../auth/auth.service";

async function enqueueForAI(userId: string, emailId: string) {
  try {
    await query("UPDATE emails SET ai_queued_at = now() WHERE id = $1 AND ai_queued_at IS NULL", [emailId]);
    await getAiQueue().add("process-email", { emailId, userId }, { jobId: `ai-${emailId}` });
  } catch (e) {
    logger.warn("Failed to enqueue email for AI processing", { emailId, error: e });
  }
}

async function getGoogleAccount(userId: string) {
  const result = await query(
    "SELECT * FROM google_accounts WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
    [userId],
  );
  return result.rows[0];
}

export async function getAuthorizedClient(userId: string) {
  const account = await getGoogleAccount(userId);
  if (!account) throw new Error("Google account is not connected");

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: decryptToken(account.access_token_enc),
    refresh_token: account.refresh_token_enc ? decryptToken(account.refresh_token_enc) : undefined,
    expiry_date: account.expiry_date ? new Date(account.expiry_date).getTime() : undefined,
  });

  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await query("UPDATE google_accounts SET access_token_enc = $2, expiry_date = to_timestamp($3 / 1000.0), updated_at = now() WHERE id = $1", [
        account.id,
        encryptToken(tokens.access_token),
        tokens.expiry_date ?? Date.now() + 3600 * 1000,
      ]);
    }
  });

  return oauth2Client;
}

export async function getInbox(userId: string, maxResults = 50) {
  const auth = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: "v1", auth });
  const response = await gmail.users.messages.list({ userId: "me", maxResults, labelIds: ["INBOX"] });
  const messages = response.data.messages ?? [];

  const parsed = [];
  for (const message of messages) {
    if (!message.id) continue;
    const full = await gmail.users.messages.get({ userId: "me", id: message.id, format: "full" });
    const item = parseGmailMessage(full.data);
    const client = await createClient(userId, {
      name: item.fromEmail.split("@")[0],
      email: item.fromEmail,
      company: null,
      phone: null,
      notes: "Auto-created from inbound Gmail message.",
      leadStatus: "warm",
    });
    const emailId = await upsertEmail(userId, { ...item, clientId: client.id, direction: "inbound" });
    emitToUser(userId, "email:new", { emailId, clientId: client.id, intent: null });
    await enqueueForAI(userId, emailId);
    parsed.push({ id: emailId, ...item, clientId: client.id, direction: "inbound" });
  }
  return parsed;
}

export async function getThread(userId: string, threadId: string) {
  const auth = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: "v1", auth });
  const thread = await gmail.users.threads.get({ userId: "me", id: threadId, format: "full" });
  return (thread.data.messages ?? []).map(parseGmailMessage);
}

export async function sendEmail(userId: string, input: { to: string; subject: string; body: string; clientId?: string | null; templateType?: string | null }) {
  const auth = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: "v1", auth });
  const raw = buildMimeEmail({ to: input.to, subject: input.subject, body: input.body });
  const sent = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });

  const emailId = await upsertEmail(userId, {
    clientId: input.clientId ?? null,
    gmailMessageId: sent.data.id ?? randomUUID(),
    gmailThreadId: sent.data.threadId ?? sent.data.id ?? randomUUID(),
    direction: "outbound",
    fromEmail: "me",
    toEmails: [input.to],
    subject: input.subject,
    bodyText: input.body,
    bodyHtml: null,
    snippet: input.body.slice(0, 180),
    sentAt: new Date().toISOString(),
  });

  return { emailId, gmailMessageId: sent.data.id, threadId: sent.data.threadId };
}

export async function replyToEmail(userId: string, input: { emailId: string; body: string }) {
  const result = await query(
    `
      SELECT e.*, c.email AS client_email
      FROM emails e
      LEFT JOIN clients c ON c.id = e.client_id
      WHERE e.user_id = $1 AND e.id = $2
    `,
    [userId, input.emailId],
  );
  const email = result.rows[0];
  if (!email) throw new Error("Email not found");

  const auth = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: "v1", auth });
  const raw = buildMimeEmail({
    to: email.from_email === "me" ? email.client_email : email.from_email,
    subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
    body: input.body,
    inReplyTo: email.gmail_message_id,
  });
  const sent = await gmail.users.messages.send({ userId: "me", requestBody: { raw, threadId: email.gmail_thread_id } });
  return { replyId: sent.data.id, threadId: sent.data.threadId };
}

export async function watchInbox(userId: string) {
  if (!env.GOOGLE_PUBSUB_TOPIC) {
    return { enabled: false, reason: "GOOGLE_PUBSUB_TOPIC is not configured" };
  }
  const auth = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: "v1", auth });
  const response = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName: env.GOOGLE_PUBSUB_TOPIC,
      labelIds: ["INBOX"],
    },
  });
  await query("UPDATE google_accounts SET watch_history_id = $2, watch_expiration = to_timestamp($3 / 1000.0), updated_at = now() WHERE user_id = $1", [
    userId,
    response.data.historyId ?? null,
    Number(response.data.expiration ?? Date.now()),
  ]);
  return response.data;
}

type PubSubPushBody = { message?: { data?: string } };
type GmailPubSubPayload = { emailAddress?: string; historyId?: string | number };

export async function processPubSubGmailNotification(body: PubSubPushBody) {
  const dataB64 = body.message?.data;
  if (!dataB64) {
    logger.warn("Gmail webhook: missing Pub/Sub message.data");
    return { processed: false as const, reason: "no_data" };
  }

  let payload: GmailPubSubPayload;
  try {
    payload = JSON.parse(Buffer.from(dataB64, "base64").toString("utf8")) as GmailPubSubPayload;
  } catch {
    logger.warn("Gmail webhook: invalid base64/json payload");
    return { processed: false as const, reason: "invalid_payload" };
  }

  const emailAddress = payload.emailAddress;
  const historyId = payload.historyId != null ? String(payload.historyId) : null;
  if (!emailAddress || !historyId) {
    logger.warn("Gmail webhook: missing emailAddress or historyId", { payload });
    return { processed: false as const, reason: "missing_fields" };
  }

  const userResult = await query<{ id: string }>("SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1", [emailAddress]);
  const userId = userResult.rows[0]?.id;
  if (!userId) {
    logger.warn("Gmail webhook: no user for mailbox", { emailAddress });
    return { processed: false as const, reason: "unknown_user" };
  }

  const accountResult = await query<{ id: string; watch_history_id: string | null }>(
    "SELECT id, watch_history_id FROM google_accounts WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
    [userId],
  );
  const account = accountResult.rows[0];
  if (!account?.watch_history_id) {
    logger.warn("Gmail webhook: watch_history_id not set; run POST /gmail/watch first", { userId });
    return { processed: false as const, reason: "no_watch_state" };
  }

  const auth = await getAuthorizedClient(userId);
  const gmail = google.gmail({ version: "v1", auth });
  const messageIds = new Set<string>();
  let pageToken: string | undefined;

  try {
    do {
      const res = await gmail.users.history.list({
        userId: "me",
        startHistoryId: account.watch_history_id,
        historyTypes: ["messageAdded"],
        pageToken,
      });
      for (const h of res.data.history ?? []) {
        for (const added of h.messagesAdded ?? []) {
          if (added.message?.id) messageIds.add(added.message.id);
        }
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
  } catch (e: any) {
    if (e?.code === 404) {
      logger.warn("Gmail history.list 404; refreshing inbox snapshot", { userId });
      await getInbox(userId, 30);
      await query("UPDATE google_accounts SET watch_history_id = $2, updated_at = now() WHERE id = $1", [account.id, historyId]);
      return { processed: true as const, messages: 0, fallback: "inbox_sync" as const };
    }
    throw e;
  }

  let count = 0;
  for (const messageId of messageIds) {
    const full = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });
    const item = parseGmailMessage(full.data);
    const client = await createClient(userId, {
      name: item.fromEmail.split("@")[0],
      email: item.fromEmail,
      company: null,
      phone: null,
      notes: "Auto-created from Gmail push notification.",
      leadStatus: "warm",
    });
    const emailId = await upsertEmail(userId, { ...item, clientId: client.id, direction: "inbound" });
    emitToUser(userId, "email:new", { emailId, clientId: client.id, intent: null });
    await enqueueForAI(userId, emailId);
    count += 1;
  }

  await query("UPDATE google_accounts SET watch_history_id = $2, updated_at = now() WHERE id = $1", [account.id, historyId]);
  return { processed: true as const, messages: count };
}
