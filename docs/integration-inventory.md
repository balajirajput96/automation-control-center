# Automation Integration Inventory

## Verified connections

| Service | Current status | Useful role in automation | Constraint or finding |
|---|---|---|---|
| GitHub | Connected through the active `balajirajput96` account | Version-control deployment files, workflow definitions, documentation, and automated checks | A secondary saved credential is invalid, but the active token is usable. |
| Google Workspace | Connected through the configured Google Workspace integration | Access and organize Drive, Sheets, Docs, Gmail, Calendar, and related Google data | Google Workspace command guidance generation did not complete in the sandbox; no account changes have been made. |
| Google Gemini | Enabled connector and Google Gemini API key available | Generate structured content, summaries, code, and workflow improvements | Use only after defining a specific automation task and output format. |
| Gemini Spark | Browser session is not signed into Gemini; no Spark entitlement is currently verifiable | Run Google-app tasks and schedules across Gmail, Calendar, Drive, Docs, Sheets, and Slides | Spark schedules can be daily, time-based, Gmail-triggered, or topic-triggered. It requires an eligible personal Google account, supported country, and Google AI Pro or Ultra subscription. It is designed to request confirmation for high-stakes actions. |
| Google Antigravity CLI | Not configured as a connector | Local project automation, code generation, repository changes, and orchestration | Official CLI is installed on the user computer using `agy`; it is a local tool and needs a connected computer or another persistent host. |
| Julius | Browser session reaches the workspace interface, but the page still exposes Log In, so account authentication has not been verified | Scheduled analytics and recurring reports, with outputs delivered through email or Slack | Julius supports connecting to external APIs, but official documentation says Julius itself cannot be called through an API. Its schedules must be configured in the Julius interface. |
| n8n | Connector enabled but target endpoint is invalid | Central cross-service workflow orchestration | The prior n8n workspace URL returns "No workspace here". A fresh local n8n Docker package is prepared but cannot be deployed until a local computer folder is connected. |

## Source references

The entries above were validated against official Google Antigravity documentation, Google Gemini Spark documentation and help pages, Julius documentation, and n8n documentation. Browser checks confirm that Gemini is not signed in within this browser session, while Julius shows its workspace interface but has not verified an authenticated account. No unverified browser account action, credential change, public publishing, scheduling change, or external message was performed.

## Automation boundary

The user requested broad automation across services. The immediate build target is therefore a documented, version-controlled automation foundation: a local n8n deployment package, a GitHub project repository, and specific task definitions for Gemini Spark, Julius, and Antigravity. Each service must only be connected when its official integration route exists and its required account access is confirmed.
