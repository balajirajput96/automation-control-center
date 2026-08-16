# Current live-readiness reconciliation — 2026-08-16

## Purpose

This document reconciles the automation assets supplied to the current execution environment. It deliberately distinguishes repository evidence and current read-only checks from claims made in prior session reports.

## Current verified state

| Surface | Current state | Evidence or boundary |
|---|---|---|
| GitHub | Available | The private control-center repository is reachable through the authenticated GitHub account. The `main` branch is clean before this documentation update. |
| GitHub Actions | Available | The repository exposes `Automation Control Health` and `Dependabot Updates`. The health workflow is read-only and validates repository contracts, n8n template JSON, Python syntax, prompt contracts, and secret-file exclusion. |
| Google Workspace CLI | Installed but unauthenticated in this sandbox | The CLI is present, but a read-only Drive lookup returned an authentication error because no CLI token or credentials file is configured here. Do not infer that a prior Drive result is current. |
| Gmail / Google Calendar connectors | Enabled but account selection requires approval | Two authorized Gmail accounts were present with no active selection; the workflow configuration points to the job-search mailbox. One authorized Calendar account was present with no active selection. Account-selection changes were submitted through the configuration approval flow and are not considered applied until confirmed. |
| Google Gemini connector | Not enabled in the current session configuration | Do not claim current connector access until it is explicitly enabled and verified. |
| Antigravity / Gemini local CLIs | Not available on the current Linux `PATH` | Supplied archives are platform-specific or unverified; no supplied binary has been executed in this environment. |
| Persistent n8n | Not available | Docker is not installed in this sandbox. The repository contains a local deployment package that requires a persistent host and Docker Desktop. |
| Current task schedule | Not configured | The current task’s schedule status was empty. A schedule snapshot supplied as an attachment belongs to an earlier task/session and is not treated as current proof. |

## Safety boundaries

The control center must remain read-only by default. It must not send messages, submit applications, publish social content, create public shares, change billing or ownership, bypass login/MFA/OTP/CAPTCHA, upload sensitive documents, pay fees, or delete data. Job-search automation may prepare reports and drafts, but a sent-message status requires a verifiable sent confirmation. Calendar entries may be created only from verified vacancy facts and only after the user has explicitly enabled that action.

## Reconciliation rule

Prior reports are historical evidence, not live credentials or live schedule state. Every provider-side claim must be re-verified through the provider’s authenticated interface before it is reported as active. If a provider is unavailable, record the blocker rather than guessing or bypassing authentication.

## Next safe steps

1. Confirm the pending Gmail and Calendar account-selection changes.
2. Perform read-only Gmail label, Sent-duplicate, Calendar, and Drive checks after account authorization is active.
3. Decide whether the daily schedule should be a read-only control review or a job-search report task. The schedule system permits one schedule per task, so the detail must be final before creation.
4. If persistent local Antigravity or n8n execution is required, connect a compatible persistent host and install the required runtime there.
5. Re-run GitHub Actions validation after any repository changes.
