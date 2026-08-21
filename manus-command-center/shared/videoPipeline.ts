export const VIDEO_PIPELINE_OPERATIONS = [
  ["clipping", "Clipping"],
  ["silenceRemoval", "Silence removal"],
  ["captions", "Captions"],
  ["voiceOver", "Voice-over"],
  ["subtitles", "Subtitles"],
  ["aspectRatioConversion", "9:16 conversion"],
] as const;

export type VideoPipelineOperationKey = (typeof VIDEO_PIPELINE_OPERATIONS)[number][0];

export function readVideoPipelineOperations(editPlan: unknown) {
  const plan = editPlan && typeof editPlan === "object" ? editPlan as Record<string, unknown> : {};
  return VIDEO_PIPELINE_OPERATIONS.map(([key, label]) => ({ key, label, enabled: plan[key] === true }));
}
