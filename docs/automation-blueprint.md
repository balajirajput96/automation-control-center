# Integrated Automation Blueprint

## Purpose

This blueprint establishes a **safe, version-controlled automation foundation** for the Google, Gemini, Julius, GitHub, Antigravity, and n8n resources named in this task. It separates **daily analysis and improvement** from **external actions**. The daily routine can collect health signals, produce recommendations, and prepare code or workflow changes automatically. Actions with broader consequences—such as sending messages, publishing public code, changing credentials, or exposing a server—remain review points even when a service offers automatic execution.

> “Spark operates under your direction. You choose whether to turn it on and what apps it connects to, and it’s designed to ask you first before performing high-stakes actions.” [1]

## Operating model

| Layer | Primary service | Responsibility | Execution method | Current readiness |
|---|---|---|---|---|
| Orchestration | n8n | Receive triggers, coordinate service calls, record workflow status, and route recoverable failures | Local Docker deployment on the user’s Windows computer | **Blocked** until a computer folder is connected and Docker Desktop is running |
| Source control | GitHub | Store the deployment package, workflow definitions, automation prompts, tests, and change history | GitHub repository under `balajirajput96` | **Ready** through the active GitHub account |
| Code and automation review | Antigravity CLI | Review repository state, run agreed checks, draft improvements, and return structured JSON results | Daily headless `agy -p` job on the user computer | **Blocked** until the local computer is connected and the CLI is authenticated |
| Workspace intelligence | Gemini Spark | Create a daily brief across authorized Google apps and monitor defined conditions | Schedule created in the Gemini app | **Blocked** because the browser session is not signed in and Spark eligibility is unverified |
| Analytics | Julius | Run recurring analyses against connected data sources and deliver a report to its configured destination | Scheduled Run created in Julius | **Blocked** until the Julius account and target dataset are confirmed |
| Google workspace data | Gmail, Calendar, Drive, Sheets, Docs | Provide authorized source material and destinations for reports | Google account permissions and connected app settings | **Partially ready**; direct browser sign-in is not currently available |

## Daily routine

The first daily automation should run in a **read-first, propose-second** mode. It should not send email, alter data, merge code, or publish a public repository without a defined approval rule.

| Time | Job | Service | Output | Default action boundary |
|---|---|---|---|---|
| 08:00 | Workday briefing | Gemini Spark | Prioritized Gmail, Calendar, and Drive summary with suggested next actions | May create a private summary; do not send external messages automatically |
| 08:15 | Automation health review | n8n | Workflow status, failed execution summary, retry candidates, and missing-credential alerts | May retry only explicitly designated safe workflows |
| 08:30 | Repository audit | Antigravity CLI | Structured code and configuration review, test status, and proposed patch list | May write a draft branch; do not merge or publish externally without a repository rule |
| 09:00 | Analytics refresh | Julius | Updated analysis and report from a named dataset | Deliver internally or to a preselected destination only |
| 09:15 | Daily control report | n8n or GitHub | Consolidated status, blockers, and approved next actions | Persist to a private repository or approved Google document |

This design follows the documented scheduling model in Gemini Spark, which supports daily time-based schedules, Gmail monitors, and topic monitors. Julius likewise supports recurring scheduled analyses, but its documentation states that external APIs can be called **from** Julius while Julius itself cannot be called programmatically. [2] [3]

## Required local files

The GitHub project should contain the following structure so every configuration change is auditable and repeatable.

```text
automation-control-center/
├── deploy/
│   └── n8n-local/
│       ├── docker-compose.yml
│       ├── .env.example
│       └── README.md
├── n8n/
│   ├── workflows/
│   └── credentials-template/
├── antigravity/
│   ├── daily-review-prompt.md
│   ├── permissions.example.json
│   └── run-daily-review.ps1
├── gemini-spark/
│   └── daily-brief-prompt.md
├── julius/
│   └── scheduled-analysis-prompt.md
├── docs/
│   ├── integration-inventory.md
│   └── runbook.md
└── README.md
```

## Service-specific implementation rules

Antigravity CLI can run one noninteractive task using `agy -p` and can return machine-readable JSON. Its headless mode needs a prior interactive login, and scoped permissions are safer than enabling blanket command execution. [4] The daily review job will therefore use a narrow, read-oriented prompt and will store its results in the repository before any code modification step.

Gemini Spark schedules should be created in the Gemini account only after its availability and connected-app permissions are confirmed. Its official documentation describes time-based schedules that can run daily, as well as Gmail and topic monitors. [2]

Julius Scheduled Runs should be configured only after the user identifies the dataset and desired report. Julius can connect to external data sources and can schedule recurring reports, but it cannot currently be invoked by an external API. [3] [5]

The n8n package will use Docker with a persistent data volume. The local service remains bound to `localhost` during setup; it must not be publicly exposed until HTTPS, authentication, and webhook requirements are explicitly configured. n8n recommends Docker for self-hosting and documents persistent data volumes for retaining workflows and credentials. [6]

## Current blockers and next actions

The first implementation actions are ready, but the following access conditions must be satisfied before service-side changes can be made.

| Dependency | What is needed | Why it is required |
|---|---|---|
| Windows computer | Connect the computer to this task and bind an empty deployment folder | The free n8n and Antigravity installation must live on a machine that stays available after this task ends |
| Docker Desktop | Install and start Docker Desktop on that computer | It runs the local n8n container and persistent data volume |
| Gemini Spark | Sign in to the personal Google account in Gemini and confirm that Spark is available | Spark schedules and connected-app permissions are managed inside the Gemini account |
| Julius | Confirm the logged-in account and choose the source dataset and report destination | Julius schedules are created in its own interface and require an analysis target |
| n8n source workflows | Provide exports or restore access to the former n8n workspace | The prior configured endpoint reports no active workspace, so its workflows cannot currently be inspected or migrated |

## References

[1]: https://gemini.google/overview/agent/spark/ "Gemini Spark — Google"
[2]: https://support.google.com/gemini/answer/17094710?hl=en "Create & manage schedules for tasks in Gemini Spark — Google Help"
[3]: https://julius.ai/docs/get-started/apis "Secret Keys and Connections — Julius"
[4]: https://antigravity.google/docs/cli/headless "Headless mode — Google Antigravity Docs"
[5]: https://julius.ai/product/scheduled-runs "Automated reports — Julius"
[6]: https://docs.n8n.io/deploy/host-n8n/install-options/install-with-docker/ "Install with Docker — n8n Docs"
