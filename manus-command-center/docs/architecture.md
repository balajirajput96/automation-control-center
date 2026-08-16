# AI Automation Command Center Architecture

## Product boundary

This application is an authenticated control plane. It stores user-owned configuration, workflow definitions, execution history, media metadata, integration status, and audit records. It does not store external-provider secrets in application tables. Secrets remain in the platform secret store or in an authorized external integration.

## Execution model

The system separates planning from execution. Agents, workflows, schedules, content jobs, and deployment targets are persisted as declarative records. Each execution creates a traceable run with state, timestamps, outputs, errors, and audit events. High-impact operations are represented as `needs_approval` until their policy permits execution.

| Capability | Primary implementation | Safety boundary |
|---|---|---|
| Multi-model chat | Server-side model catalog and LLM invocation | Provider model IDs discovered at runtime; no client-side keys |
| Agent management | Persisted profiles with Manual, Assisted, and Autonomous policies | Tool permissions and external actions remain policy-controlled |
| Workflow automation | JSON node/edge definitions plus validated run records | Execution is traceable; external actions require authorized connection state |
| Scheduling | Persisted schedule records backed by production callback jobs | Cron tasks are idempotent, owned by user, and only activated after deployment |
| Content and media | Content projects, sources, assets, and render-job records | Generated assets are stored in managed object storage; unsupported actions are explicit |
| Integrations | Health registry and provider metadata | A service is shown as connected only after a real authorized health check |
| Deployments | Provider targets and deployment event records | GitHub, Vercel, Cloudflare, and Google Cloud remain action-required until credentials exist |

## Hosting decision

The dashboard, API, database, authenticated callbacks, and scheduled HTTP work fit the managed application environment. CPU-intensive video transcoding and persistent queue workers are intentionally modeled as jobs but are not executed in the default deployment. They require a separately authorized rendering or persistent-compute integration before activation.

## Data ownership

Every user-created resource carries an owner identifier. Server procedures must verify ownership before reads, updates, scheduling, or execution. Media objects are stored outside the database; the database only keeps object keys, serving URLs, and metadata.
