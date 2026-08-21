import { readFile } from "node:fs/promises";
import { storagePut } from "../server/storage.ts";
import { addAuditEvent, addMediaAssetForOwner } from "../server/db.ts";

const ownerId = 1;
const contentProjectId = 1;
const assets = [
  { label: "source", name: "Internal blueprint verification source.mp4", kind: "video", mimeType: "video/mp4", path: "/home/ubuntu/webdev-static-assets/internal-blueprint-command-center-verification.mp4" },
  { label: "thumbnail", name: "Internal blueprint verification thumbnail.png", kind: "thumbnail", mimeType: "image/png", path: "/home/ubuntu/webdev-static-assets/internal-blueprint-command-center-reference-fallback.png" },
  { label: "output", name: "Internal blueprint verification review-output.mp4", kind: "video", mimeType: "video/mp4", path: "/home/ubuntu/webdev-static-assets/internal-blueprint-command-center-verification.mp4" },
];

const created = [];
for (const asset of assets) {
  const bytes = await readFile(asset.path);
  const safeName = asset.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  const stored = await storagePut(`command-center/${ownerId}/media/internal-verification/${asset.label}-${safeName}`, bytes, asset.mimeType);
  const id = await addMediaAssetForOwner(ownerId, {
    contentProjectId,
    kind: asset.kind,
    name: asset.name,
    storageKey: stored.key,
    storageUrl: stored.url,
    mimeType: asset.mimeType,
    bytes: bytes.length,
    metadata: { internalVerification: true, generatedFor: "non_rendering_video_slot_validation", role: asset.label },
  });
  await addAuditEvent(ownerId, { action: "media.uploaded", resourceType: "media_asset", resourceId: String(id ?? ""), outcome: "success", detail: `Stored internal-only ${asset.label} media asset for non-rendering video-slot validation.` });
  created.push({ id, label: asset.label, storageKey: stored.key, bytes: bytes.length });
}

console.log(JSON.stringify({ ownerId, contentProjectId, created }, null, 2));
