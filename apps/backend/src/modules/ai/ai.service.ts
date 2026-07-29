import OpenAI from "openai";
import { IntentResultSchema, type EmailIntent } from "@abhi2/shared";
import { env } from "../../config/env";
import { query } from "../../config/db";
import { getEmail, listEmailsForClient, updateEmailIntent } from "../emails/emails.service";
import { emitToUser } from "../../sockets/socket.handler";

let client: OpenAI | null = null;

function getOpenAI() {
  if (!client)
    client = new OpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
  return client;
}


export async function detectIntent(emailBody: string) {
  if (env.OPENROUTER_API_KEY === "dev-openrouter-key") {
    const lowered = emailBody.toLowerCase();
    const intent: EmailIntent = lowered.includes("price") || lowered.includes("cost") ? "pricing" : lowered.includes("not interested") ? "not_interested" : "general";
    return { intent, confidence: 0.72, summary: "Local heuristic result" };
  }

  const response = await getOpenAI().chat.completions.create({
    model: env.AI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'You are an email intent classifier for a B2B sales CRM. Classify into exactly one of: pricing, interested, not_interested, confused, general. Return a JSON object with fields: intent (string), confidence (number 0-1), summary (string, max 10 words).',
      },
      { role: "user", content: emailBody },
    ],
  });

  const text = response.choices[0].message.content ?? "{}";
  return IntentResultSchema.parse(JSON.parse(text));
}

export async function generateReply(input: {
  emailBody: string;
  clientContext: { name: string; company?: string | null; leadStatus?: string; previousEmails?: string[] };
  intent: EmailIntent;
}) {
  if (env.OPENROUTER_API_KEY === "dev-openrouter-key") {
    return `Hi ${input.clientContext.name},\n\nThanks for reaching out. I understand this is about ${input.intent.replace("_", " ")}. I can share the right details and keep it concise.\n\nWould it help if I sent over the next best option for your team?\n\nBest,\nYour Name`;
  }

  const response = await getOpenAI().chat.completions.create({
    model: env.AI_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a professional sales representative. Be warm, human, and concise under 150 words. Address the intent directly. End with a soft CTA. Do not use "I hope this email finds you well". Sign off as the account owner.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          client: input.clientContext,
          intent: input.intent,
          originalEmail: input.emailBody,
          previousEmails: input.clientContext.previousEmails ?? [],
        }),
      },
    ],
  });

  return response.choices[0].message.content?.trim() ?? "";
}

export async function generateFollowUpEmail(input: {
  clientName: string;
  company?: string | null;
  dayNumber: number;
  previousEmails: string[];
  intent: EmailIntent | null;
}): Promise<string> {
  if (env.OPENROUTER_API_KEY === "dev-openrouter-key") {
    const intentContext = input.intent ? ` regarding ${input.intent.replace("_", " ")}` : "";
    return `Hi ${input.clientName},\n\nJust following up on our previous conversation${intentContext}. Happy to answer any questions or share the next best step if this is still on your radar.\n\nBest,\nYour Name`;
  }

  const response = await getOpenAI().chat.completions.create({
    model: env.AI_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a professional sales representative writing a follow-up email (day ${input.dayNumber} of outreach). Be warm, brief (under 100 words), reference prior context naturally if available. End with a single soft call-to-action. Do not use "I hope this email finds you well". Sign off as the account owner.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          clientName: input.clientName,
          company: input.company,
          dayNumber: input.dayNumber,
          intent: input.intent,
          previousEmailSummaries: input.previousEmails,
        }),
      },
    ],
  });

  return response.choices[0].message.content?.trim() ?? "";
}

export async function processIncomingEmail(userId: string, emailId: string) {
  const email = await getEmail(userId, emailId);
  if (!email) throw new Error("Email not found");

  const intent = await detectIntent(email.bodyText);
  await updateEmailIntent(userId, emailId, intent.intent);
  emitToUser(userId, "ai:intent_detected", { emailId, intent: intent.intent, confidence: intent.confidence });

  const previous = email.clientId ? await listEmailsForClient(userId, email.clientId) : [];
  const reply = await generateReply({
    emailBody: email.bodyText,
    intent: intent.intent,
    clientContext: {
      name: email.fromEmail.split("@")[0],
      company: null,
      leadStatus: "warm",
      previousEmails: previous.slice(0, 2).map((item: any) => `${item.direction}: ${item.subject} - ${item.snippet ?? ""}`),
    },
  });

  await query(
    `
      INSERT INTO ai_generations (user_id, email_id, intent, confidence, summary, reply, model)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [userId, emailId, intent.intent, intent.confidence, intent.summary, reply, env.AI_MODEL],
  );
  emitToUser(userId, "ai:reply_ready", { emailId, reply });
  return { intent, reply };
}
