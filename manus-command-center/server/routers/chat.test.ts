import { describe, expect, it } from "vitest";
import { providerForModel } from "./chat";

describe("providerForModel", () => {
  it("groups supported model families without hardcoding individual versions", () => {
    expect(providerForModel("gemini-3-flash-preview")).toBe("Gemini");
    expect(providerForModel("claude-sonnet-4-6")).toBe("Claude");
    expect(providerForModel("gpt-5-mini")).toBe("GPT");
    expect(providerForModel("custom-runtime-model")).toBe("Other");
  });
});
