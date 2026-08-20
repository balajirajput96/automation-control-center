# Historical Automation Inventory

## Purpose

This inventory preserves the accessible, useful automation state discovered during the protected environment review. It records only source paths, validated behaviors, and operational boundaries; it never includes secret values, browser cookies, OAuth codes, API keys, or local runtime output.

## Reusable assets

| Asset | Classification | Current role | Verification or constraint |
|---|---|---|---|
| `scripts/validate_n8n_template.py` and 12 inactive import templates | Working — preserve | Static n8n safety contract for credential-free, inactive workflow imports | Validation is local; the configured n8n Cloud endpoint remains unavailable. |
| `scripts/test_gemini.py` | Working — preserve | Stateless Gemini Interactions API health check | Requires the managed Gemini credential at runtime and reports only a non-secret success marker. |
| `.github/workflows/automation-control-health.yml` | Working — improve | Scheduled and change-triggered static validation | Read-only workflow with repository-only permissions and a 30-day non-secret execution-record artifact. |
| `manus-command-center/` | Working with constrained build check | Authenticated command-center application and contract tests | Type checks and unit tests pass; the sandbox production build limit remains documented. |
| `gemini-spark/daily-brief-prompt.md` | Prepared — preserve | Read-only daily Google Workspace briefing definition | Provider-side schedule state is not currently verifiable from the browser. |
| `julius/scheduled-analysis-prompt.md` | Prepared — preserve | Read-only recurring analysis definition | Jules browser dashboard remains region-limited, while the authenticated Jules CLI can list connected repositories. |
| `antigravity/` prompts and runners | Working — preserve | Local agent review instructions and validation boundaries | Antigravity CLI authentication is persistent; no workspace is trusted automatically. |
| `reports/private/automation-execution.jsonl` | Working — new local record | Machine-readable, ignored execution history for authorized maintenance runs | Created only by an explicit local command; it is not committed or uploaded automatically. |
| `scripts/record_terminal_history_metadata.py` | Working — new local record | Metadata-only inventory of shell-history files | Records file path, size, modification time, and availability without reading command content. |

## Historical sources reviewed safely

The review found two primary private repositories, a small Bash history source, repository commit and stash metadata, GitHub workflow definitions, n8n templates, Python validation utilities, CLI configuration directories, and an active daily control schedule. Command history was inspected only as metadata and was not replayed; no secret-bearing command contents were printed or copied.

## Controlled daily operating model

The enabled daily control review remains the primary low-frequency orchestration path. Each run should use the existing reusable assets in this order: inspect repository state, validate static contracts, check authorized provider readiness, record a secret-safe result locally, document or repair only confirmed low-risk issues, validate again, and publish only private verified changes. The record schema is implemented by `scripts/record_automation_run.py`. The existing GitHub Actions health workflow separately retains a non-secret execution-record artifact for 30 days.

The credential-continuity operating procedure is recorded in `docs/credential-continuity-runbook.md`. It preserves provider-managed and local secure login state by reference, never by copying credentials or raw terminal history into the repository.

## Known boundaries

The configured n8n endpoint still returns a provider `404` response and must not receive imports or modifications until the valid workspace is supplied. Gemini Spark provider scheduling and Julius browser scheduling remain unverified; their prepared prompt definitions must not be represented as active provider-side schedules. The command-center production build remains an environment-constrained check until it completes on a suitable runner.
