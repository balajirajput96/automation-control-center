import { describe, expect, it } from "vitest";
import { assertManagedVideoAssetReference } from "../db";
import { mediaKindMatchesMime, mediaRouter, videoRouter } from "./media";

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

  it("rejects incompatible and unsupported upload MIME declarations before storage", async () => {
    const caller = mediaRouter.createCaller({ user: { id: 42 } } as any);
    await expect(caller.upload({ name: "Wrong kind", kind: "audio", mimeType: "image/png", dataBase64: "aGVsbG8=" })).rejects.toThrow("Media kind audio is not compatible with MIME type image/png");
    await expect(caller.upload({ name: "Wrong MIME", kind: "image", mimeType: "text/plain", dataBase64: "aGVsbG8=" })).rejects.toThrow("Unsupported media MIME type");
  });

  it("rejects invisible, cross-project, and wrong-kind managed asset references for video slots", () => {
    // An owner-scoped lookup returns no row for an asset outside the caller's ownership.
    expect(() => assertManagedVideoAssetReference("source", undefined, 18)).toThrow("Managed media asset not found");
    expect(() => assertManagedVideoAssetReference("source", { contentProjectId: 99, kind: "video" }, 18)).toThrow("Managed media asset is not attached to this content project");
    expect(() => assertManagedVideoAssetReference("source", { contentProjectId: 18, kind: "audio" }, 18)).toThrow("Source slot requires a video asset");
    expect(() => assertManagedVideoAssetReference("output", { contentProjectId: 18, kind: "image" }, 18)).toThrow("Output slot requires a video asset");
    expect(() => assertManagedVideoAssetReference("thumbnail", { contentProjectId: 18, kind: "video" }, 18)).toThrow("Thumbnail slot requires an image or thumbnail asset");
  });
});
