# Free Local n8n Deployment

This package runs **n8n Community Edition** on a Windows computer through Docker Desktop. It is deliberately bound to `127.0.0.1`, so the editor is reachable only from the same computer at `http://localhost:5678`. This is the safest free starting configuration for building and testing workflows.

## Prerequisites

Install and start [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/). Docker Desktop must show that its engine is running before the deployment command is executed. The incomplete `OllamaSetup.exe(1).crdownload` file is unrelated to this installation and should not be used.

## Start n8n

Copy this folder to a permanent location on the Windows computer, such as `C:\n8n`. In PowerShell, open that folder and run the following commands:

```powershell
Copy-Item .env.example .env
notepad .env
docker compose up -d
```

Set `GENERIC_TIMEZONE` in `.env` to the appropriate IANA timezone. For India, leave it as `Asia/Kolkata`. Then open `http://localhost:5678` in a browser. n8n will guide you through creating the initial owner account.

## Normal Operations

| Task | PowerShell command |
|---|---|
| Check the service | `docker compose ps` |
| View logs | `docker compose logs -f n8n` |
| Stop n8n | `docker compose down` |
| Start n8n later | `docker compose up -d` |
| Update n8n | `docker compose pull; docker compose up -d` |

The `n8n_data` Docker volume retains workflows, credentials, and the encryption key when n8n restarts. Do not delete it unless you intentionally want to wipe the instance.

## Webhooks and Deployment Limits

This free configuration is intended for local workflow building and use. It cannot safely receive public webhooks while the computer is off, sleeping, or disconnected. Before exposing webhook workflows, set up a protected HTTPS endpoint and update the public base URL configuration; do not expose port 5678 directly to the internet.

## Next Step

After the computer is connected to this task and this folder is bound, I can copy the package, run it, confirm that n8n starts, install or rebuild the workflows, and troubleshoot each execution.
