import { Queue } from "bullmq";
import { getRedis } from "../config/redis";

export type FollowupJob = {
  followupId: string;
  clientId: string;
  userId: string;
  dayNumber: 1 | 3 | 5 | 7;
};

let queue: Queue<FollowupJob> | null = null;

export function getFollowupQueue() {
  if (!queue) {
    queue = new Queue<FollowupJob>("followupQueue", {
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
