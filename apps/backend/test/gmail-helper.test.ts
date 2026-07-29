import { describe, expect, it } from "vitest";
import { base64UrlEncode, parseGmailMessage } from "../src/utils/gmail.helper";

describe("gmail helper", () => {
  it("parses basic Gmail payloads", () => {
    const parsed = parseGmailMessage({
      id: "m1",
      threadId: "t1",
      snippet: "hello",
      payload: {
        headers: [
          { name: "From", value: "Client <client@example.com>" },
          { name: "To", value: "me@example.com" },
          { name: "Subject", value: "Pricing" },
        ],
        body: { data: base64UrlEncode("What does it cost?") },
      },
    });

    expect(parsed.fromEmail).toBe("client@example.com");
    expect(parsed.subject).toBe("Pricing");
    expect(parsed.bodyText).toBe("What does it cost?");
  });
});
