# Antigravity CLI Daily Review

Google Antigravity CLI is the local code-review and maintenance component of this automation system. It is intended to run on the same Windows computer that hosts the local n8n deployment. The daily review is **read-first and report-only**: it assesses the repository and produces structured recommendations without sending messages, changing credentials, publishing public code, or editing workflow data.

## Installation

Install Antigravity CLI from an elevated PowerShell session using the official Windows command:

```powershell
irm https://antigravity.google/cli/install.ps1 | iex
```

Then open the repository directory and run `agy` interactively once. Complete the Google sign-in flow and confirm that the workspace is trusted. The noninteractive daily runner relies on those cached credentials. Official documentation states that headless runs require a prior interactive login. [1]

## Configure the daily task

Run the following command in PowerShell after `agy` works interactively:

```powershell
powershell -ExecutionPolicy Bypass -File .\antigravity\register-daily-review.ps1
```

The task is named **Automation Control Center — Daily Antigravity Review** and is scheduled for 08:30 each day. Its output is saved under `reports\private`, which stays out of Git by default.

## Safety model

The runner calls `agy -p` with an output schema. It does not use `--dangerously-skip-permissions`. Keep the default permission posture or grant only specific read and test commands through Antigravity settings. This follows the CLI’s documented guidance to prefer scoped permissions over blanket approval. [1]

## References

[1]: https://antigravity.google/docs/cli/headless "Headless mode — Google Antigravity Docs"
