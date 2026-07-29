import { Worker, Queue } from "bullmq";
import { getRedis } from "../../config/redis";
import { query } from "../../config/db";
import { env } from "../../config/env";
import { getInbox, watchInbox } from "../../modules/gmail/gmail.service";
import { logger } from "../../utils/logger";

type PollJob = { userId: string };
type WatchRenewJob = { userId: string };

let pollQueue: Queue<PollJob> | null = null;
let watchRenewQueue: Queue<WatchRenewJob> | null = null;

function getPollQueue() {
  if (!pollQueue) {
    pollQueue = new Queue<PollJob>("pollQueue", {
      connection: getRedis(),
      defaultJobOptions: { removeOnComplete: 10, removeOnFail: 50 },
    });
  }
  return pollQueue;
}

function getWatchRenewQueue() {
  if (!watchRenewQueue) {
    watchRenewQueue = new Queue<WatchRenewJob>("watchRenewQueue", {
      connection: getRedis(),
      defaultJobOptions: { removeOnComplete: 10, removeOnFail: 50 },
    });
  }
  return watchRenewQueue;
}

async function getAllUserIds(): Promise<string[]> {
  const result = await query<{ id: string }>("SELECT id FROM users ORDER BY created_at ASC");
  return result.rows.map((r) => r.id);
}

async function getUsersWithGmailAccounts(): Promise<string[]> {
  const result = await query<{ user_id: string }>(
    "SELECT DISTINCT user_id FROM google_accounts ORDER BY user_id ASC",
  );
  return result.rows.map((r) => r.user_id);
}

export async function startPollWorker() {
  const pollIntervalMs = env.POLL_INTERVAL_MINUTES * 60 * 1000;
  const watchRenewIntervalMs = 6 * 24 * 60 * 60 * 1000;

  const userIds = await getAllUserIds();

  for (const userId of userIds) {
    await getPollQueue().add(
      "gmail-poll",
      { userId },
      {
        repeat: { every: pollIntervalMs },
        jobId: `poll-${userId}`,
      },
    );
    logger.info("Scheduled Gmail poll cron", { userId, intervalMinutes: env.POLL_INTERVAL_MINUTES });
  }

  if (env.GOOGLE_PUBSUB_TOPIC) {
    const gmailUsers = await getUsersWithGmailAccounts();
    for (const userId of gmailUsers) {
      await getWatchRenewQueue().add(
        "gmail-watch-renew",
        { userId },
        {
          repeat: { every: watchRenewIntervalMs },
          jobId: `watch-renew-${userId}`,
        },
      );
      logger.info("Scheduled Gmail watch renewal cron", { userId });
    }
  }

  const pollWorker = new Worker<PollJob>(
    "pollQueue",
    async (job) => {
      const { userId } = job.data;
      logger.info("Polling Gmail inbox", { userId });
      try {
        const results = await getInbox(userId, 20);
        logger.info("Gmail poll complete", { userId, newEmails: results.length });
        return { polled: true, count: results.length };
      } catch (e: any) {
        if (e?.message?.includes("Google account is not connected")) {
          logger.warn("Gmail poll skipped: no connected account", { userId });
          return { polled: false, reason: "no_account" };
        }
        throw e;
      }
    },
    { connection: getRedis(), concurrency: 1 },
  );

  const watchRenewWorker = new Worker<WatchRenewJob>(
    "watchRenewQueue",
    async (job) => {
      const { userId } = job.data;
      logger.info("Renewing Gmail watch", { userId });
      try {
        const result = await watchInbox(userId);
        logger.info("Gmail watch renewed", { userId, result });
        return { renewed: true };
      } catch (e: any) {
        logger.error("Gmail watch renewal failed", { userId, error: e });
        throw e;
      }
    },
    { connection: getRedis(), concurrency: 1 },
  );

  pollWorker.on("failed", (job, error) =>
    logger.error("Poll job failed", { jobId: job?.id, userId: job?.data.userId, error }),
  );
  watchRenewWorker.on("failed", (job, error) =>
    logger.error("Watch renew job failed", { jobId: job?.id, userId: job?.data.userId, error }),
  );

  return { pollWorker, watchRenewWorker, getPollQueue, getWatchRenewQueue };
}
