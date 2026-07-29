import { Worker } from "bullmq";
import { getRedis } from "../../config/redis";
import { sendEmail } from "../../modules/gmail/gmail.service";
import { emitToUser } from "../../sockets/socket.handler";
import { logger } from "../../utils/logger";
import type { SendEmailJob } from "../emailQueue";

export function startEmailWorker() {
  const worker = new Worker<SendEmailJob>(
    "emailQueue",
    async (job) => {
      logger.info("Sending queued email", { jobId: job.id });
      const result = await sendEmail(job.data.userId, job.data);
      emitToUser(job.data.userId, "email:new", {
        emailId: result.emailId,
        clientId: job.data.clientId ?? null,
        intent: null,
      });
      return result;
    },
    { connection: getRedis(), concurrency: 5 },
  );

  worker.on("failed", (job, error) => logger.error("Email job failed", { jobId: job?.id, error }));
  return worker;
}
