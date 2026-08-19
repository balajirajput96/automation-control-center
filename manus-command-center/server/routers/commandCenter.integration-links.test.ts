import { describe, expect, it } from "vitest";
import { credentialManagementLinks } from "./commandCenter";

describe("credential-management links", () => {
  it("exposes the official GitHub and Google credential-management targets", () => {
    expect(credentialManagementLinks.github).toEqual({
      url: "https://github.com/settings/personal-access-tokens",
      label: "Manage GitHub personal access tokens",
    });
    expect(credentialManagementLinks.google_cloud.url).toBe("https://console.cloud.google.com/apis/credentials");
  });

  it("covers the configured external providers without embedding secrets", () => {
    expect(Object.keys(credentialManagementLinks).sort()).toEqual(["cloudflare", "github", "gmail", "google_cloud", "instagram", "vercel"]);
    expect(Object.values(credentialManagementLinks).every(({ url }) => { const parsed = new URL(url); return parsed.username === "" && parsed.password === "" && parsed.search === "" && parsed.hash === ""; })).toBe(true);
  });
});
