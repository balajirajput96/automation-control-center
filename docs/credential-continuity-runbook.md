# Credential Continuity and Daily Maintenance Runbook

## Purpose

This runbook preserves the automation system's ability to resume daily maintenance without exporting passwords, API keys, OAuth codes, browser cookies, terminal commands, or connector secrets. Authentication is retained only in the provider-managed or local secure stores used by each approved tool. The repository stores reproducible procedures, capability checks, and non-secret execution records.

## Credential continuity model

| Integration | Approved persistence location | Non-secret readiness check | Re-authentication boundary |
|---|---|---|---|
| GitHub CLI | Local authenticated CLI profile and the current session's managed credential injection | `gh auth status` | User-controlled GitHub sign-in only when the active profile is unavailable. |
| Antigravity CLI | Local provider-managed Google OAuth profile | `agy models` | User completes Google OAuth and the first-run data-use selection when prompted. |
| Jules CLI | Local provider-managed Google OAuth profile | `jules remote list --repo` | User completes Google OAuth when a sign-in page opens. |
| Gemini CLI | Managed Gemini credential injected at runtime; the supported noninteractive mode is `GEMINI_CLI_AUTH_TYPE=gemini-api-key` | Run a minimal prompt in an isolated trusted temporary directory | Do not retry the retired individual OAuth path; user action is required only if the managed API credential is unavailable. |
| Manus connectors | Encrypted connector storage managed by the platform | Inspect enabled names and perform scoped read-only checks | Connector changes require the platform's user review flow. |
| Browser sessions | Browser-managed account session store | Open a provider page only when a provider-specific check is needed | User takes over only for provider sign-in, consent, or challenge screens. |

> No credential value, token, cookie, OAuth callback code, or browser-session export belongs in this repository, GitHub Actions artifact, terminal-history record, or generated report.

## Terminal-history boundary

Raw shell history can contain credentials, private paths, pasted commands, or one-time authorization material. It is therefore not copied, replayed, uploaded, or committed. Use `scripts/record_terminal_history_metadata.py` to create a local ignored record that contains only the configured history-file path, availability, byte count, and modification timestamp. This keeps operational context without treating terminal history as an automation input.

## Daily maintenance procedure

The active daily review should proceed in this order:

1. Confirm private repository alignment, scheduled-workflow status, and the enabled daily review state.
2. Run local static checks for n8n templates, Python utilities, execution-record contracts, and tracked-secret protections.
3. Run bounded, read-only CLI readiness checks for GitHub, Antigravity, Jules, and Gemini only when their executable is available.
4. Check configured provider endpoints only through their approved read-only interfaces. Treat unavailable services, invalid workspaces, or missing provider sessions as blockers rather than bypass targets.
5. Record the outcome with `scripts/record_automation_run.py` and refresh terminal-history metadata locally. Generated records remain under `reports/private/` and are ignored by Git.
6. Apply only verified low-risk documentation, tests, templates, or configuration-contract repairs. Validate them, then publish to the private repository.

The GitHub Actions health workflow separately creates a 30-day non-secret execution-record artifact for each repository validation run. It does not receive, store, or inspect third-party credentials.

## Safe recovery rules

If a CLI loses access, preserve the existing local state and use its official sign-in flow. If a connector is unavailable, inspect its enabled state and require the platform's confirmation flow for changes. If a provider endpoint returns an authorization or workspace error, document the blocker and retain inactive or read-only behavior. Never attempt to bypass a login prompt, MFA, regional availability restriction, Cloudflare challenge, or provider access control.
