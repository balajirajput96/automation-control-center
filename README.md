# Automation Control Center

This repository is the **single source of truth** for the user's cross-platform automation environment. It contains the local n8n deployment configuration, automation definitions, safe daily-review prompts, and operational documentation. It is initially private so credentials, workflow structure, and operating notes remain protected.

## What is included

| Area | Purpose | Current status |
|---|---|---|
| `deploy/n8n-local` | Docker Compose configuration for local n8n with persistent storage | Ready to transfer to the connected Windows computer |
| `n8n/workflows` | Exported n8n workflow JSON files | Awaiting recovery or export from the prior workspace |
| `antigravity` | Daily code and configuration review prompts and scheduled runner | Awaiting local Antigravity CLI installation and login |
| `gemini-spark` | Prompt and setup guide for the daily Google Workspace brief | Awaiting confirmed Gemini Spark access |
| `julius` | Prompt and setup guide for scheduled analysis | Awaiting Julius account authentication and dataset selection |
| `docs` | Integration inventory, architecture blueprint, and operating runbook | Initial inventory and blueprint are complete |

## Operating principles

The system operates with **least privilege**. It automates analysis, health checks, drafting, validation, and documentation before it automates external actions. Messages, payments, credential changes, public publishing, and destructive data operations stay gated behind explicit project rules or service-level confirmation.

## Current deployment status

The prior n8n Cloud endpoint is unavailable. This repository therefore carries a free, self-hosted local deployment path based on Docker Desktop. To complete deployment, connect a Windows computer to this task, bind an empty folder, install Docker Desktop, and run the Compose configuration in `deploy/n8n-local`.

## References

The technical design is documented in [the automation blueprint](docs/automation-blueprint.md). The latest connection and account evidence is recorded in [the integration inventory](docs/integration-inventory.md).
