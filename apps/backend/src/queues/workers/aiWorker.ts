import { Worker } from "bullmq";
import { getRedis } from "../../config/redis";
import { query } from "../../config/db";
import { env } from "../../config/env";
import { processIncomingEmail } from "../../modules/ai/ai.service";
import { scheduleFollowups } from "../../modules/followups/followups.service";
import { logger } from "../../utils/logger";
import type { ProcessEmailJob } from "../aiQueue";
import type { EmailIntent, FollowupDay } from "@abhi2/shared";

const INTENT_FOLLOWUP_DAYS: Record<EmailIntent, FollowupDay[]> = {
  interested:     [1, 3, 5, 7],
  pricing:        [1, 3],
  confused:       [1],
  general:        [3],
  not_interested: [],
};

export function startAiWorker() {
  const worker = new Worker<ProcessEmailJob>(
    "aiQueue",
    async (job) => {
      const { emailId, userId } = job.data;
      logger.info("AI agent: processing email", { jobId: job.id, emailId });

      const emailResult = await query<{
        intent: string | null;
        body_text: string;
        client_id: string | null;
        direction: string;
      }>(
        "SELECT intent, body_text, client_id, direction FROM emails WHERE id = $1 AND user_id = $2",
        [emailId, userId],
      );
      const email = emailResult.rows[0];

      if (!email) {
        logger.warn("AI agent: email not found, skipping", { emailId });
        return { skipped: true, reason: "email_not_found" };
      }

      if (email.direction !== "inbound") {
        return { skipped: true, reason: "not_inbound" };
      }

      if (email.intent) {
        logger.info("AI agent: intent already set, skipping", { emailId, intent: email.intent });
        return { skipped: true, reason: "already_processed" };
      }

      if (!email.body_text?.trim()) {
        logger.warn("AI agent: email body empty, skipping", { emailId });
        return { skipped: true, reason: "empty_body" };
      }

      if (!env.AI_AUTO_PROCESS) {
        return { skipped: true, reason: "ai_auto_process_disabled" };
      }

      const { intent } = await processIncomingEmail(userId, emailId);
      logger.info("AI agent: processed email", { emailId, intent: intent.intent });

      if (!env.AUTO_SCHEDULE_FOLLOWUPS) {
        return { processed: true, intent: intent.intent, followupsScheduled: 0 };
      }

      const daysToSchedule = INTENT_FOLLOWUP_DAYS[intent.intent] ?? [];
      if (daysToSchedule.length === 0) {
        logger.info("AI agent: no follow-ups for intent", { emailId, intent: intent.intent });
        return { processed: true, intent: intent.intent, followupsScheduled: 0 };
      }

      const clientId = email.client_id;
      if (!clientId) {
        logger.warn("AI agent: no client linked, skipping follow-up scheduling", { emailId });
        return { processed: true, intent: intent.intent, followupsScheduled: 0 };
      }

      const existing = await query<{ count: string }>(
        "SELECT COUNT(*) AS count FROM followups WHERE email_id = $1 AND status NOT IN ('cancelled')",
        [emailId],
      );
      if (Number(existing.rows[0]?.count ?? 0) > 0) {
        logger.info("AI agent: follow-ups already exist, skipping", { emailId });
        return { processed: true, intent: intent.intent, followupsScheduled: 0 };
      }

      await scheduleFollowups(userId, {
        clientId,
        emailId,
        days: daysToSchedule,
      });

      logger.info("AI agent: follow-ups scheduled", { emailId, intent: intent.intent, days: daysToSchedule });
      return { processed: true, intent: intent.intent, followupsScheduled: daysToSchedule.length };
    },
    { connection: getRedis(), concurrency: 2 },
  );

  worker.on("failed", (job, error) =>
    logger.error("AI agent: job failed", { jobId: job?.id, emailId: job?.data.emailId, error }),
  );

  worker.on("completed", (job, result) =>
    logger.info("AI agent: job completed", { jobId: job.id, result }),
  );

  return worker;
}
