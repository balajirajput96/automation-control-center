export type AutonomyLevel = "manual" | "assisted" | "autonomous";
export type GovernedAction = "plan" | "research" | "generate_content" | "publish" | "deploy" | "delete" | "credential_change";

const highImpactActions = new Set<GovernedAction>(["publish", "deploy", "delete", "credential_change"]);

export function evaluateExecutionPolicy(autonomyLevel: AutonomyLevel, action: GovernedAction) {
  if (autonomyLevel === "manual") return { decision: "needs_approval" as const, reason: "Manual agents require approval before every execution." };
  if (autonomyLevel === "assisted" && highImpactActions.has(action)) return { decision: "needs_approval" as const, reason: "Assisted agents require approval for high-impact actions." };
  if (autonomyLevel === "autonomous" && highImpactActions.has(action)) return { decision: "needs_approval" as const, reason: "Autonomous agents still require approval for publishing, deployment, deletion, and credential changes." };
  return { decision: "allowed" as const, reason: "The selected autonomy policy permits this low-risk action." };
}
