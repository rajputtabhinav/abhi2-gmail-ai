import { describe, expect, it } from "vitest";
import { decryptToken, encryptToken } from "../src/utils/crypto";

describe("token encryption", () => {
  it("round trips AES-GCM token payloads", () => {
    const encrypted = encryptToken("secret-token");
    expect(encrypted).not.toContain("secret-token");
    expect(decryptToken(encrypted)).toBe("secret-token");
  });
});
