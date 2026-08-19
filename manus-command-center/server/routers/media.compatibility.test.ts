import { describe, expect, it } from "vitest";
import { mediaKindMatchesMime, videoRouter } from "./media";

describe("managed media compatibility rules", () => {
  it("accepts only MIME types compatible with their declared media kind", () => {
    expect(mediaKindMatchesMime("image", "image/png")).toBe(true);
    expect(mediaKindMatchesMime("thumbnail", "image/webp")).toBe(true);
    expect(mediaKindMatchesMime("video", "video/mp4")).toBe(true);
    expect(mediaKindMatchesMime("audio", "video/mp4")).toBe(false);
    expect(mediaKindMatchesMime("thumbnail", "video/mp4")).toBe(false);
    expect(mediaKindMatchesMime("document", "image/png")).toBe(false);
  });

  it("rejects unrecognized vertical-video storage metadata before persistence", async () => {
    const caller = videoRouter.createCaller({ user: { id: 42 } } as any);
    await expect(caller.create({ title: "Metadata test", outputFormat: "vertical_9_16", targetDurationSeconds: 60, storageMetadata: { attachmentMode: "owner_scoped_managed_asset", unsafeKey: "blocked" } as any })).rejects.toThrow();
  });
});
