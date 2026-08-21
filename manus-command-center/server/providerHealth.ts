import { createSign } from "node:crypto";

export type ProviderHealth = { connectionStatus: "connected" | "action_required" | "error"; targetStatus: "healthy" | "failed" | "not_connected"; detail: string };
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type ProviderEnv = Record<string, string | undefined>;

function missing(detail: string): ProviderHealth { return { connectionStatus: "action_required", targetStatus: "not_connected", detail }; }
function failed(provider: string, status?: number): ProviderHealth { return { connectionStatus: "error", targetStatus: "failed", detail: `${provider} health verification failed${status ? ` (${status})` : ""}.` }; }

export async function checkVercelHealth(env: ProviderEnv = process.env, request: FetchLike = fetch): Promise<ProviderHealth> {
  const token = env.VERCEL_API_TOKEN; const projectId = env.VERCEL_PROJECT_ID; const teamId = env.VERCEL_TEAM_ID;
  if (!token || !projectId) return missing("Vercel credential and project mapping are not configured; health check was not run.");
  const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
  try {
    const response = await request(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}${query}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return failed("Vercel", response.status);
    const project = await response.json() as { name?: string };
    return { connectionStatus: "connected", targetStatus: "healthy", detail: `Credential-backed Vercel project verification succeeded for ${project.name || projectId}.` };
  } catch { return failed("Vercel"); }
}

export async function checkCloudflareHealth(env: ProviderEnv = process.env, request: FetchLike = fetch): Promise<ProviderHealth> {
  const token = env.CLOUDFLARE_API_TOKEN; const accountId = env.CLOUDFLARE_ACCOUNT_ID; const workerName = env.CLOUDFLARE_WORKER_NAME;
  if (!token || !accountId || !workerName) return missing("Cloudflare credential, account, and Worker mapping are not configured; health check was not run.");
  try {
    const response = await request(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(workerName)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return failed("Cloudflare", response.status);
    return { connectionStatus: "connected", targetStatus: "healthy", detail: `Credential-backed Cloudflare Worker verification succeeded for ${workerName}.` };
  } catch { return failed("Cloudflare"); }
}

function base64Url(value: string | Buffer) { return Buffer.from(value).toString("base64url"); }
async function googleAccessToken(env: ProviderEnv, request: FetchLike) {
  if (env.GOOGLE_CLOUD_ACCESS_TOKEN) return env.GOOGLE_CLOUD_ACCESS_TOKEN;
  if (!env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON) return null;
  const service = JSON.parse(env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON) as { client_email?: string; private_key?: string; token_uri?: string };
  if (!service.client_email || !service.private_key) throw new Error("Invalid service account JSON");
  const now = Math.floor(Date.now() / 1000);
  const assertionBase = `${base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64Url(JSON.stringify({ iss: service.client_email, scope: "https://www.googleapis.com/auth/cloud-platform", aud: service.token_uri || "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }))}`;
  const signer = createSign("RSA-SHA256"); signer.update(assertionBase); signer.end();
  const assertion = `${assertionBase}.${signer.sign(service.private_key).toString("base64url")}`;
  const response = await request(service.token_uri || "https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }).toString() });
  if (!response.ok) throw new Error(`Google OAuth exchange failed (${response.status})`);
  return (await response.json() as { access_token?: string }).access_token || null;
}

export async function checkGoogleCloudHealth(env: ProviderEnv = process.env, request: FetchLike = fetch): Promise<ProviderHealth> {
  const projectId = env.GOOGLE_CLOUD_PROJECT_ID;
  if (!projectId || (!env.GOOGLE_CLOUD_ACCESS_TOKEN && !env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON)) return missing("Google Cloud service credential and deployment target are not configured; health check was not run.");
  try {
    const accessToken = await googleAccessToken(env, request);
    if (!accessToken) return failed("Google Cloud");
    const response = await request(`https://cloudresourcemanager.googleapis.com/v1/projects/${encodeURIComponent(projectId)}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) return failed("Google Cloud", response.status);
    return { connectionStatus: "connected", targetStatus: "healthy", detail: `Credential-backed Google Cloud project verification succeeded for ${projectId}.` };
  } catch { return failed("Google Cloud"); }
}
