import { ScheduleFollowupsSchema, type FollowupDay, type ScheduleFollowupsInput } from "@abhi2/shared";
import { Job } from "bullmq";
import { query } from "../../config/db";
import { getFollowupQueue } from "../../queues/followupQueue";
import { emitToUser } from "../../sockets/socket.handler";

const dayToDelayMs: Record<FollowupDay, number> = {
  1: 86_400_000,
  3: 259_200_000,
  5: 432_000_000,
  7: 604_800_000,
};

export async function scheduleFollowups(userId: string, input: ScheduleFollowupsInput) {
  const parsed = ScheduleFollowupsSchema.parse(input);
  const created = [];

  for (const dayNumber of parsed.days) {
    const scheduledFor = new Date(Date.now() + dayToDelayMs[dayNumber]);
    const result = await query(
      `
        INSERT INTO followups (user_id, client_id, email_id, day_number, scheduled_for)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id AS "userId", client_id AS "clientId", email_id AS "emailId",
                  day_number AS "dayNumber", status, job_id AS "jobId",
                  scheduled_for AS "scheduledFor", sent_at AS "sentAt", created_at AS "createdAt"
      `,
      [userId, parsed.clientId, parsed.emailId ?? null, dayNumber, scheduledFor],
    );
    const followup = result.rows[0];
    const job = await getFollowupQueue().add(
      "schedule-followup",
      { followupId: followup.id, clientId: parsed.clientId, userId, dayNumber },
      { delay: dayToDelayMs[dayNumber] },
    );
    await query("UPDATE followups SET job_id = $2, status = 'queued', updated_at = now() WHERE id = $1", [followup.id, job.id]);
    const hydrated = { ...followup, jobId: job.id, status: "queued" };
    emitToUser(userId, "followup:scheduled", { followupId: followup.id, clientId: parsed.clientId, dayNumber });
    created.push(hydrated);
  }

  return created;
}

export async function listFollowups(userId: string) {
  const result = await query(
    `
      SELECT id, user_id AS "userId", client_id AS "clientId", email_id AS "emailId",
             day_number AS "dayNumber", status, job_id AS "jobId",
             scheduled_for AS "scheduledFor", sent_at AS "sentAt", created_at AS "createdAt"
      FROM followups
      WHERE user_id = $1
      ORDER BY scheduled_for ASC
    `,
    [userId],
  );
  return result.rows;
}

export async function listFollowupsForClient(userId: string, clientId: string) {
  const result = await query(
    `
      SELECT id, user_id AS "userId", client_id AS "clientId", email_id AS "emailId",
             day_number AS "dayNumber", status, job_id AS "jobId",
             scheduled_for AS "scheduledFor", sent_at AS "sentAt", created_at AS "createdAt"
      FROM followups
      WHERE user_id = $1 AND client_id = $2
      ORDER BY scheduled_for ASC
    `,
    [userId, clientId],
  );
  return result.rows;
}

export async function cancelFollowup(userId: string, id: string) {
  const result = await query("SELECT job_id FROM followups WHERE user_id = $1 AND id = $2", [userId, id]);
  const jobId = result.rows[0]?.job_id;
  if (jobId) {
    const job = await Job.fromId(getFollowupQueue(), jobId);
    if (job) await job.remove().catch(() => undefined);
  }
  await query("UPDATE followups SET status = 'cancelled', updated_at = now() WHERE user_id = $1 AND id = $2", [userId, id]);
  return { ok: true };
}

export async function updateFollowupStatus(userId: string, id: string, status: string) {
  const result = await query(
    `
      UPDATE followups
      SET status = $3, updated_at = now(), sent_at = CASE WHEN $3 = 'sent' THEN now() ELSE sent_at END
      WHERE user_id = $1 AND id = $2
      RETURNING id, user_id AS "userId", client_id AS "clientId", email_id AS "emailId",
                day_number AS "dayNumber", status, job_id AS "jobId",
                scheduled_for AS "scheduledFor", sent_at AS "sentAt", created_at AS "createdAt"
    `,
    [userId, id, status],
  );
  return result.rows[0] ?? null;
}
