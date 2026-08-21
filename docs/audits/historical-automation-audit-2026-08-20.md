# Historical Automation Audit — 2026-08-20

## Purpose

This audit preserves reusable controls without copying raw shell history, credentials, tokens, private logs, or service-side authentication material into GitHub. The scripts are anchored to the current repository at runtime and write only ignored metadata and validation results under `reports/private/workspace-maintenance/`.

The repository remains the documented **single source of truth** for cross-platform automation configuration and operating guidance. The newly integrated scripts are reviewable controls; they do not grant permissions, authenticate accounts, merge pull requests, send messages, publish repositories, or expose local services.

## Preserved controls

| Control | Role | Safety boundary |
|---|---|---|
| `scripts/workspace-maintenance/historical_discovery.sh` | Inventory shell-history metadata, current-repository state, and command availability into TSV output. | Records only history-file path, size, and modification time; it never reads history content, cron contents, or credentials. |
| `scripts/workspace-maintenance/inventory_historical_automation.sh` | Inventory shell scripts, GitHub Actions workflows, automation-related files, and existing validation evidence. | Classifies files and references secret usage without extracting secret values. |
| `scripts/workspace-maintenance/check_workflows.sh` | Read-only GitHub Actions run inventory for non-fork repositories. | Requires the caller's existing `gh` authorization and records API errors separately from no-run results. |
| `scripts/workspace-maintenance/verify_current_project_integrations.sh` | Read-only Project B, GitHub Actions, pull-request, Jules, Antigravity, Gemini, and monitoring checks. | Defers absent or intentionally deferred authentication; does not attempt login or change connectors. |
| `scripts/workspace-maintenance/daily_maintenance.sh` | Run the current repository's discovery, workflow, integration, contract, and syntax checks. | Every stage is bounded and logged locally; no cleanup, repository mutation, or history replay occurs. |

## Evidence-based classification

Authentication remains explicitly bounded. GitHub, Antigravity, Jules, and Gemini CLI readiness is checked only through their current approved local or provider-managed state; no script initiates sign-in, prints credential values, or changes a connector. n8n packages are validated structurally unless a valid provider workspace is available.

## Daily execution

The scripts are not a replacement for the active daily control review. They are reusable bounded diagnostics that can be invoked from a controlled checkout with the current repository path, and their output remains ignored locally.

## Review and integration policy

All repository changes from this audit are staged on the review branch `manus/historical-maintenance-audit`. The default branch is not force-pushed and no pull request is auto-merged. Service logins, MFA, quotas, billing, and permission boundaries are not bypassed. Any future service-side authentication must be completed interactively by the account owner through the provider's normal OAuth or login flow.

## Reproduction notes

Run the static regression checks first:

```bash
bash scripts/workspace-maintenance/test_workspace_maintenance.sh
```

Then run the controlled current-repository diagnostics. For GitHub checks, use an already-authorized `gh` session and review the resulting ignored TSV files before taking any action:

```bash
WORKSPACE_OUTPUT_DIR=reports/private/workspace-maintenance scripts/workspace-maintenance/daily_maintenance.sh
```

The daily runner writes machine-readable local output under `reports/private/workspace-maintenance/`. Review failures rather than suppressing them; the runner continues through bounded stages so the final TSV contains a complete picture.

Repository recovery is deliberately **plan-first**. `recover_repositories.sh --plan` emits an ignored TSV identifying clean fast-forward or clone candidates without touching any checkout. An apply run requires an explicit `ALLOW_REPOSITORY_RECOVERY=1` environment flag and refuses to proceed through a dirty working tree or a non-Git destination. It never moves or deletes existing files automatically.
