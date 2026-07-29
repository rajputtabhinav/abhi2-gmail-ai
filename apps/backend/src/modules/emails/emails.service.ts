import { query } from "../../config/db";
import { clientCountsByStatus } from "../clients/clients.service";

const emailSelect = `
  SELECT id, user_id AS "userId", client_id AS "clientId", gmail_message_id AS "gmailMessageId",
         gmail_thread_id AS "gmailThreadId", direction, from_email AS "fromEmail", to_emails AS "toEmails",
         subject, body_text AS "bodyText", body_html AS "bodyHtml", snippet, intent,
         sent_at AS "sentAt", created_at AS "createdAt"
  FROM emails
`;

export async function listEmails(userId: string) {
  const result = await query(`${emailSelect} WHERE user_id = $1 ORDER BY COALESCE(sent_at, created_at) DESC LIMIT 200`, [userId]);
  return result.rows;
}

export async function getEmail(userId: string, id: string) {
  const result = await query(`${emailSelect} WHERE user_id = $1 AND id = $2`, [userId, id]);
  return result.rows[0] ?? null;
}

export async function listEmailsForClient(userId: string, clientId: string) {
  const result = await query(`${emailSelect} WHERE user_id = $1 AND client_id = $2 ORDER BY COALESCE(sent_at, created_at) DESC`, [userId, clientId]);
  return result.rows;
}

export async function upsertEmail(userId: string, input: {
  clientId: string | null;
  gmailMessageId: string;
  gmailThreadId: string;
  direction: "inbound" | "outbound";
  fromEmail: string;
  toEmails: string[];
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  snippet: string | null;
  intent?: string | null;
  sentAt?: string | null;
}) {
  const result = await query(
    `
      INSERT INTO emails (
        user_id, client_id, gmail_message_id, gmail_thread_id, direction, from_email, to_emails,
        subject, body_text, body_html, snippet, intent, sent_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (user_id, gmail_message_id) DO UPDATE
      SET client_id = COALESCE(EXCLUDED.client_id, emails.client_id),
          subject = EXCLUDED.subject,
          body_text = EXCLUDED.body_text,
          body_html = EXCLUDED.body_html,
          snippet = EXCLUDED.snippet,
          intent = COALESCE(EXCLUDED.intent, emails.intent),
          sent_at = EXCLUDED.sent_at
      RETURNING id
    `,
    [
      userId,
      input.clientId,
      input.gmailMessageId,
      input.gmailThreadId,
      input.direction,
      input.fromEmail,
      input.toEmails,
      input.subject,
      input.bodyText,
      input.bodyHtml,
      input.snippet,
      input.intent ?? null,
      input.sentAt ?? null,
    ],
  );
  return result.rows[0].id as string;
}

export async function updateEmailIntent(userId: string, emailId: string, intent: string) {
  await query("UPDATE emails SET intent = $3 WHERE user_id = $1 AND id = $2", [userId, emailId, intent]);
}

export async function dashboardSummary(userId: string) {
  const [clientCounts, emailCounts, weeklyRows] = await Promise.all([
    clientCountsByStatus(userId),
    query<{ total: string; sent_today: string }>(
      `
        SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE direction = 'outbound' AND created_at::date = now()::date) AS sent_today
        FROM emails
        WHERE user_id = $1
      `,
      [userId],
    ),
    query<{ day: string; value: string }>(
      `
        WITH series AS (
          SELECT generate_series(
            (CURRENT_DATE - INTERVAL '6 days')::date,
            CURRENT_DATE::date,
            INTERVAL '1 day'
          )::date AS bucket
        )
        SELECT series.bucket::text AS day,
               COUNT(e.id)::text AS value
        FROM series
        LEFT JOIN emails e ON e.user_id = $1 AND (e.created_at AT TIME ZONE 'UTC')::date = series.bucket
        GROUP BY series.bucket
        ORDER BY series.bucket
      `,
      [userId],
    ),
  ]);
  const totalLeads = Object.values(clientCounts).reduce((sum, count) => sum + count, 0);
  const closed = clientCounts.closed ?? 0;
  const weeklyActivity = weeklyRows.rows.map((row) => ({
    day: row.day,
    value: Number(row.value ?? 0),
  }));
  return {
    totalLeads,
    hotLeads: clientCounts.hot ?? 0,
    emailsSentToday: Number(emailCounts.rows[0]?.sent_today ?? 0),
    conversionRate: totalLeads ? Math.round((closed / totalLeads) * 100) : 0,
    statusCounts: clientCounts,
    totalEmails: Number(emailCounts.rows[0]?.total ?? 0),
    weeklyActivity,
  };
}
