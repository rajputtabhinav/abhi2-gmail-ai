import { Queue } from "bullmq";
import { getRedis } from "../config/redis";

export type SendEmailJob = {
  userId: string;
  to: string;
  subject: string;
  body: string;
  clientId?: string | null;
  templateType?: string | null;
};

let queue: Queue<SendEmailJob> | null = null;

export function getEmailQueue() {
  if (!queue) {
    queue = new Queue<SendEmailJob>("emailQueue", {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }
  return queue;
}
