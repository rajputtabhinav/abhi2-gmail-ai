import { Queue } from "bullmq";
import { getRedis } from "../config/redis";

export type ProcessEmailJob = {
  emailId: string;
  userId: string;
};

let queue: Queue<ProcessEmailJob> | null = null;

export function getAiQueue() {
  if (!queue) {
    queue = new Queue<ProcessEmailJob>("aiQueue", {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 500,
        removeOnFail: 2000,
      },
    });
  }
  return queue;
}
