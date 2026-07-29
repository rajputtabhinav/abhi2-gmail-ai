import { describe, expect, it } from "vitest";
import { cn } from "../lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", false && "hidden", "px-4")).toContain("px-4");
  });
});
