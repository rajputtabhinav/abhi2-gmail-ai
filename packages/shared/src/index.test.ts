import { describe, expect, it } from "vitest";
import { IntentResultSchema, ScheduleFollowupsSchema } from "./index";

describe("shared contracts", () => {
  it("validates intent results", () => {
    expect(IntentResultSchema.parse({ intent: "pricing", confidence: 0.92, summary: "Asked about packages" })).toEqual({
      intent: "pricing",
      confidence: 0.92,
      summary: "Asked about packages",
    });
  });

  it("defaults follow-up days", () => {
    expect(ScheduleFollowupsSchema.parse({ clientId: "8b3535c7-465f-4965-b129-c79cf18ccb8d" }).days).toEqual([1, 3, 5, 7]);
  });
});
