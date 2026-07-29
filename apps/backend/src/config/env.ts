import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().default("postgresql://user:pass@localhost:5432/abhi2"),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(32).default("dev-only-jwt-secret-change-before-production-000000"),
  JWT_EXPIRY: z.string().default("7d"),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[a-fA-F0-9]{64}$/)
    .default("0000000000000000000000000000000000000000000000000000000000000000"),
  LOCAL_USER_EMAIL: z.string().email().default("admin@local.dev"),
  LOCAL_PASSWORD: z.string().min(4).default("abhi2local"),
  GOOGLE_CLIENT_ID: z.string().default("dev-google-client-id"),
  GOOGLE_CLIENT_SECRET: z.string().default("dev-google-client-secret"),
  GOOGLE_REDIRECT_URI: z.string().url().default("http://localhost:4000/api/auth/google/callback"),
  GOOGLE_PUBSUB_TOPIC: z.string().optional().default(""),
  OPENROUTER_API_KEY: z.string().default("dev-openrouter-key"),
  AI_MODEL: z.string().default("anthropic/claude-sonnet-4-6"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  POLL_INTERVAL_MINUTES: z.coerce.number().min(1).default(5),
  AUTO_SCHEDULE_FOLLOWUPS: z
    .string()
    .transform((v) => v !== "false")
    .pipe(z.boolean())
    .default(true),
  AI_AUTO_PROCESS: z
    .string()
    .transform((v) => v !== "false")
    .pipe(z.boolean())
    .default(true),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(input = process.env): Env {
  return EnvSchema.parse(input);
}

export const env = loadEnv();
