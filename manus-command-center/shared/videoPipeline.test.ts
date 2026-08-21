import { describe, expect, it } from "vitest";
import { readVideoPipelineOperations } from "./videoPipeline";

describe("readVideoPipelineOperations", () => {
  it("preserves every persisted operation as explicitly enabled or disabled", () => {
    expect(readVideoPipelineOperations({ clipping: true, silenceRemoval: true, captions: false, voiceOver: true, subtitles: true, aspectRatioConversion: true })).toEqual([
      { key: "clipping", label: "Clipping", enabled: true },
      { key: "silenceRemoval", label: "Silence removal", enabled: true },
      { key: "captions", label: "Captions", enabled: false },
      { key: "voiceOver", label: "Voice-over", enabled: true },
      { key: "subtitles", label: "Subtitles", enabled: true },
      { key: "aspectRatioConversion", label: "9:16 conversion", enabled: true },
    ]);
  });

  it("treats absent or malformed plans as disabled rather than assuming operations ran", () => {
    expect(readVideoPipelineOperations(null).every(operation => operation.enabled === false)).toBe(true);
    expect(readVideoPipelineOperations({ captions: "yes" }).find(operation => operation.key === "captions")?.enabled).toBe(false);
  });
});
