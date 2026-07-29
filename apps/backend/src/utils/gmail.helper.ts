type GmailHeader = { name?: string | null; value?: string | null };
type GmailPart = {
  mimeType?: string | null;
  filename?: string | null;
  body?: { data?: string | null };
  parts?: GmailPart[];
};

export function base64UrlDecode(input = "") {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

export function base64UrlEncode(input: string) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function headerValue(headers: GmailHeader[] = [], name: string) {
  return headers.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function collectBody(part: GmailPart | undefined, mimeType: string): string {
  if (!part) return "";
  if (part.mimeType === mimeType && part.body?.data) return base64UrlDecode(part.body.data);
  return part.parts?.map((child) => collectBody(child, mimeType)).find(Boolean) ?? "";
}

export function parseGmailMessage(message: any) {
  const payload = message.payload ?? {};
  const headers = payload.headers ?? [];
  const bodyText = collectBody(payload, "text/plain") || base64UrlDecode(payload.body?.data ?? "");
  const bodyHtml = collectBody(payload, "text/html") || null;

  return {
    gmailMessageId: message.id as string,
    gmailThreadId: message.threadId as string,
    fromEmail: extractEmail(headerValue(headers, "From")),
    toEmails: headerValue(headers, "To")
      .split(",")
      .map((value) => extractEmail(value))
      .filter(Boolean),
    subject: headerValue(headers, "Subject") || "(No subject)",
    snippet: message.snippet ?? null,
    bodyText,
    bodyHtml,
    sentAt: headerValue(headers, "Date") ? new Date(headerValue(headers, "Date")).toISOString() : null,
  };
}

export function extractEmail(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim().toLowerCase();
}

export function buildMimeEmail(input: { from?: string; to: string; subject: string; body: string; inReplyTo?: string }) {
  const headers = [
    input.from ? `From: ${input.from}` : "",
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    input.inReplyTo ? `In-Reply-To: ${input.inReplyTo}` : "",
    input.inReplyTo ? `References: ${input.inReplyTo}` : "",
  ].filter(Boolean);

  return base64UrlEncode(`${headers.join("\r\n")}\r\n\r\n${input.body}`);
}
