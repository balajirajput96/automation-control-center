# Historical Automation Audit — 2026-08-20

## Purpose

This audit preserves the surviving local-first engineering and automation state discovered in the Ubuntu workspace. It records reusable controls without copying raw shell history, credentials, tokens, private logs, or service-side authentication material into GitHub.

The repository remains the documented **single source of truth** for cross-platform automation configuration and operating guidance. The newly integrated scripts are reviewable controls; they do not grant permissions, authenticate accounts, merge pull requests, send messages, publish repositories, or expose local services.

## Preserved controls

| Control | Role | Safety boundary |
|---|---|---|
| `scripts/workspace-maintenance/historical_discovery.sh` | Inventory shell-history presence, workspace paths, repository state, cron entries, and command availability into TSV output. | Reports presence and versions only; does not print credentials or raw history. |
| `scripts/workspace-maintenance/inventory_historical_automation.sh` | Inventory shell scripts, GitHub Actions workflows, automation-related files, and existing validation evidence. | Classifies files and references secret usage without extracting secret values. |
| `scripts/workspace-maintenance/check_workflows.sh` | Read-only GitHub Actions run inventory for non-fork repositories. | Requires the caller's existing `gh` authorization and records API errors separately from no-run results. |
| `scripts/workspace-maintenance/verify_current_project_integrations.sh` | Read-only Project B, GitHub Actions, pull-request, Jules, Antigravity, Gemini, and monitoring checks. | Defers absent or intentionally deferred authentication; does not attempt login or change connectors. |
| `scripts/workspace-maintenance/daily_maintenance.sh` | Run static triage, project checks, exact tests, Python tests, and tree cleanliness checks. | Every stage is bounded and logged; the wrapper now returns nonzero when any stage or tree check fails. |

## Evidence-based classification

The current workspace contains 32 synchronized repositories. The daily run completed with return code `0` for static triage, project checks, exact tests, Python tests, and Git status. The post-run repository scan found zero dirty trees. These facts are recorded in the local checkpoint files and are intentionally not represented as claims that external services are permanently healthy.

The earlier `run_project_checks_cycle.sh` remains a historical implementation. The active `run_project_checks_cycle2.sh` is the preferred local runner because it supports cached dependencies, uses `--ignore-scripts` for safe installs in this environment, and applies hard timeouts. The two workflow inventories are complementary: one inventories recent GitHub runs for the canonical repositories, while the other checks the full repository inventory.

Authentication remains explicitly bounded. GitHub CLI is authenticated and was successfully queried. Jules is installed, but its read-only remote probe currently reports that the OAuth client session is unavailable; interactive login is therefore deferred to the account owner. Antigravity login remains deferred at the user's request. Gemini CLI is not installed or authorized. Docker is unavailable in the current sandbox, so n8n packages are validated structurally rather than launched.

## Daily execution

The local scheduled entry is configured for 02:00 India Standard Time with `flock` overlap protection:

```cron
CRON_TZ=Asia/Kolkata
0 2 * * * flock -n /tmp/github-workspace-daily-maintenance.lock /usr/bin/env bash /home/ubuntu/github-workspace/daily_maintenance.sh
```

The local workspace is intentionally separate from this repository because it contains the cloned 32-repository test surface and machine-generated checkpoint logs. A deployment operator may copy the review-approved scripts into the workspace or invoke them from a controlled checkout after reviewing their path assumptions.

## Review and integration policy

All repository changes from this audit are staged on the review branch `manus/historical-maintenance-audit`. The default branch is not force-pushed and no pull request is auto-merged. Service logins, MFA, quotas, billing, and permission boundaries are not bypassed. Any future service-side authentication must be completed interactively by the account owner through the provider's normal OAuth or login flow.

## Reproduction notes

Run shell syntax checks first:

```bash
bash -n scripts/workspace-maintenance/*.sh
```

Then run the discovery and inventory controls with an explicit output directory. For GitHub checks, use an already-authorized `gh` session and review the resulting TSV files before taking any action:

```bash
scripts/workspace-maintenance/historical_discovery.sh ./audit-output/historical-discovery.tsv
scripts/workspace-maintenance/inventory_historical_automation.sh ./audit-output/automation-inventory.tsv
scripts/workspace-maintenance/check_workflows.sh ./audit-output/repos.tsv ./audit-output/workflow-status.tsv
scripts/workspace-maintenance/verify_current_project_integrations.sh
```

The daily runner is designed for the established `/home/ubuntu/github-workspace` layout. Its output is machine-readable under `checkpoints/`, with per-stage logs under `checkpoints/daily_logs/`. Review failures rather than suppressing them; the runner intentionally continues through all bounded stages so the final TSV contains a complete picture.
