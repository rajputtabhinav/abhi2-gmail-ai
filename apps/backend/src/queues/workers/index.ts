import { startEmailWorker } from "./emailWorker";
import { startFollowupWorker } from "./followupWorker";
import { startAiWorker } from "./aiWorker";
import { startPollWorker } from "./pollWorker";
import { logger } from "../../utils/logger";

const emailWorker = startEmailWorker();
const followupWorker = startFollowupWorker();
const aiWorker = startAiWorker();

logger.info("Core workers started (email, followup, ai)");

startPollWorker()
  .then(({ pollWorker, watchRenewWorker }) => {
    logger.info("Poll + watch-renew crons registered");

    process.on("SIGINT", async () => {
      await Promise.all([
        emailWorker.close(),
        followupWorker.close(),
        aiWorker.close(),
        pollWorker.close(),
        watchRenewWorker.close(),
      ]);
      process.exit(0);
    });
  })
  .catch((err) => {
    logger.error("Failed to start poll worker", { err });
    process.exit(1);
  });
