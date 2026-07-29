import { Worker } from "bullmq";
import { getRedis } from "../../config/redis";
import { query } from "../../config/db";
import { generateFollowUpEmail } from "../../modules/ai/ai.service";
import { sendEmail } from "../../modules/gmail/gmail.service";
import { listEmailsForClient } from "../../modules/emails/emails.service";
import { emitToUser } from "../../sockets/socket.handler";
import { logger } from "../../utils/logger";
import type { FollowupJob } from "../followupQueue";
import type { EmailIntent } from "@abhi2/shared";

export function startFollowupWorker() {
  const worker = new Worker<FollowupJob>(
    "followupQueue",
    async (job) => {
      const followup = await query(
        `
          SELECT f.*, c.email, c.name, c.company, e.intent
          FROM followups f
          JOIN clients c ON c.id = f.client_id
          LEFT JOIN emails e ON e.id = f.email_id
          WHERE f.id = $1 AND f.status IN ('queued', 'scheduled')
        `,
        [job.data.followupId],
      );
      const row = followup.rows[0];
      if (!row) return { skipped: true };

      const previousEmails = await listEmailsForClient(job.data.userId, row.client_id);
      const previousSummaries = previousEmails
        .slice(0, 3)
        .map((e: any) => `${e.direction}: ${e.subject} - ${e.snippet ?? ""}`);

      const body = await generateFollowUpEmail({
        clientName: row.name,
        company: row.company ?? null,
        dayNumber: row.day_number,
        previousEmails: previousSummaries,
        intent: (row.intent as EmailIntent | null) ?? null,
      });

      await sendEmail(job.data.userId, {
        to: row.email,
        subject: `Following up${row.company ? ` with ${row.company}` : ""}`,
        body,
        clientId: row.client_id,
        templateType: `day-${row.day_number}`,
      });
      await query("UPDATE followups SET status = 'sent', sent_at = now(), updated_at = now() WHERE id = $1", [row.id]);
      emitToUser(job.data.userId, "followup:sent", { followupId: row.id, clientId: row.client_id });
      return { sent: true };
    },
    { connection: getRedis(), concurrency: 3 },
  );

  worker.on("failed", async (job, error) => {
    logger.error("Follow-up job failed", { jobId: job?.id, error });
    if (job?.data.followupId) {
      await query("UPDATE followups SET status = 'failed', updated_at = now() WHERE id = $1", [job.data.followupId]).catch(() => undefined);
    }
  });

  return worker;
}
