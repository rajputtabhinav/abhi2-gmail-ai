import { z } from "zod";

export const leadStatuses = ["hot", "warm", "cold", "closed", "lost"] as const;
export const emailDirections = ["inbound", "outbound"] as const;
export const emailIntents = ["pricing", "interested", "not_interested", "confused", "general"] as const;
export const followupStatuses = ["scheduled", "queued", "sent", "failed", "cancelled", "skipped"] as const;
export const followupDays = [1, 3, 5, 7] as const;

export const LeadStatusSchema = z.enum(leadStatuses);
export const EmailDirectionSchema = z.enum(emailDirections);
export const EmailIntentSchema = z.enum(emailIntents);
export const FollowupStatusSchema = z.enum(followupStatuses);
export const FollowupDaySchema = z.union([z.literal(1), z.literal(3), z.literal(5), z.literal(7)]);

export type LeadStatus = z.infer<typeof LeadStatusSchema>;
export type EmailDirection = z.infer<typeof EmailDirectionSchema>;
export type EmailIntent = z.infer<typeof EmailIntentSchema>;
export type FollowupStatus = z.infer<typeof FollowupStatusSchema>;
export type FollowupDay = z.infer<typeof FollowupDaySchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
});

export const ClientSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  company: z.string().nullable(),
  email: z.string().email(),
  phone: z.string().nullable(),
  notes: z.string().nullable(),
  leadStatus: LeadStatusSchema,
  isDeleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const EmailSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  clientId: z.string().uuid().nullable(),
  gmailMessageId: z.string(),
  gmailThreadId: z.string(),
  direction: EmailDirectionSchema,
  fromEmail: z.string().email(),
  toEmails: z.array(z.string().email()),
  subject: z.string(),
  bodyText: z.string(),
  bodyHtml: z.string().nullable(),
  snippet: z.string().nullable(),
  intent: EmailIntentSchema.nullable(),
  sentAt: z.string().nullable(),
  createdAt: z.string(),
});

export const FollowupSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  clientId: z.string().uuid(),
  emailId: z.string().uuid().nullable(),
  dayNumber: FollowupDaySchema,
  status: FollowupStatusSchema,
  jobId: z.string().nullable(),
  scheduledFor: z.string(),
  sentAt: z.string().nullable(),
  createdAt: z.string(),
});

export const IntentResultSchema = z.object({
  intent: EmailIntentSchema,
  confidence: z.number().min(0).max(1),
  summary: z.string().max(80),
});

export const CreateClientSchema = z.object({
  name: z.string().min(1).max(160),
  company: z.string().max(160).optional().nullable(),
  email: z.string().email(),
  phone: z.string().max(60).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  leadStatus: LeadStatusSchema.default("warm"),
});

export const UpdateClientSchema = CreateClientSchema.partial();

export const SendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(20000),
  clientId: z.string().uuid().optional().nullable(),
  templateType: z.string().max(80).optional().nullable(),
});

export const ReplyEmailSchema = z.object({
  emailId: z.string().uuid(),
  body: z.string().min(1).max(20000),
});

export const DetectIntentSchema = z.object({
  emailBody: z.string().min(1).max(50000),
});

export const GenerateReplySchema = z.object({
  emailBody: z.string().min(1).max(50000),
  clientContext: z.object({
    name: z.string(),
    company: z.string().nullable().optional(),
    leadStatus: LeadStatusSchema.optional(),
    previousEmails: z.array(z.string()).default([]),
  }),
  intent: EmailIntentSchema,
});

export const ProcessEmailSchema = z.object({
  emailId: z.string().uuid(),
});

export const ScheduleFollowupsSchema = z.object({
  clientId: z.string().uuid(),
  emailId: z.string().uuid().optional().nullable(),
  days: z.array(FollowupDaySchema).min(1).default([1, 3, 5, 7]),
});

export const UpdateFollowupStatusSchema = z.object({
  status: FollowupStatusSchema,
});

export type User = z.infer<typeof UserSchema>;
export type Client = z.infer<typeof ClientSchema>;
export type Email = z.infer<typeof EmailSchema>;
export type Followup = z.infer<typeof FollowupSchema>;
export type IntentResult = z.infer<typeof IntentResultSchema>;
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type SendEmailInput = z.infer<typeof SendEmailSchema>;
export type ReplyEmailInput = z.infer<typeof ReplyEmailSchema>;
export type ScheduleFollowupsInput = z.infer<typeof ScheduleFollowupsSchema>;

export type ApiResponse<T> = {
  data: T;
  error?: never;
};

export type ApiError = {
  data?: never;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};

export type SocketEvents = {
  "email:new": { emailId: string; clientId: string | null; intent: EmailIntent | null };
  "email:replied": { emailId: string; replyId: string };
  "ai:intent_detected": { emailId: string; intent: EmailIntent; confidence: number };
  "ai:reply_ready": { emailId: string; reply: string };
  "followup:scheduled": { followupId: string; clientId: string; dayNumber: FollowupDay };
  "followup:sent": { followupId: string; clientId: string };
  "client:status_changed": { clientId: string; newStatus: LeadStatus };
};
