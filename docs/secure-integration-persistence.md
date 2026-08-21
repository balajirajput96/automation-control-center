# Secure Integration Persistence Runbook

## Purpose

This repository is the durable source of truth for validated maintenance code, GitHub Actions workflows, sanitized checkpoints, and operational runbooks. It is not a credential vault. Passwords, personal access tokens, OAuth refresh tokens, API keys, and private CLI credential files must never be committed, copied into issues, or written to logs.

## What is preserved

The repository preserves the validated workspace-maintenance scripts, the hourly GitHub audit workflow, the 2,400-execution state contract, test coverage, workflow documentation, sanitized execution records, and recovery procedures. The local workspace may also contain historical reports and checkpoints, but the durable copy must remain secret-free.

Raw shell history is not copied into GitHub. Historical history can contain passwords, tokens, device codes, URLs containing one-time credentials, and other sensitive material. The safe representation is a sanitized inventory of scripts, repositories, schedules, test results, and integration states.

## Credential placement

Credentials required by hosted workflows belong in protected GitHub Actions Secrets or Environments. The workflow may reference names such as `AUDIT_GH_TOKEN`, but it must not print the value or record it in state. A supported read-only token is required for owner-level private-repository inventory; the default repository token is intentionally limited and the workflow records that limitation as `authorization_scope_blocker`.

Credentials required by local CLIs belong in the provider's official credential store on a durable user-controlled machine. The automation must use each provider's official login flow and must never scan, export, duplicate, or guess credential contents.

## Current CLI contract

| Integration | Safe automation behavior |
|---|---|
| GitHub CLI | Use the official CLI session when `gh auth status` succeeds. Never print token material. Hosted workflows use protected GitHub Actions secrets where broader scope is needed. |
| Jules CLI | Installation and OAuth availability are checked without initiating login. Login must be completed by the user through the official OAuth flow. |
| Antigravity CLI | Installation and authorization are checked only if the official binary is present. Login remains user-controlled and deferred until explicitly requested. |
| Gemini CLI | Installation and authorization are checked only if the official binary is present. API keys must be placed through an official protected secret mechanism, never in source or history. |

The reusable checker is `scripts/integration-health/check_cli_integrations.sh`. It writes a TSV report containing only timestamps, installation state, coarse authorization state, configuration-directory presence, and sanitized notes.

## Recurring execution

The local convenience cron runs the validated daily maintenance runner at 02:00 IST with overlap protection. The durable GitHub Actions workflow runs the bounded hourly continuation and persists its counter and recovery record on the dedicated state branch. The hosted workflow is the durable automation path; local cron and local CLI sessions are environment-dependent conveniences and may need restoration after a sandbox or machine replacement.

## Recovery procedure

First clone the repository and run the local health checker. Then restore only the official CLI binaries that are missing, using provider documentation. Authenticate interactively as the user; do not paste or commit credentials. Finally, configure required GitHub Actions Secrets through GitHub's protected settings UI and run the workflow manually once to confirm the state contract. A missing credential must produce a visible, sanitized blocker record rather than a fabricated success.

## Security boundary

Requests to bypass MFA, OAuth consent, quotas, billing, permission checks, or provider controls must be refused. A successful automation system is one that remains recoverable and auditable without weakening those controls.
