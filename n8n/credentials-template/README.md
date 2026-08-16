# n8n Credentials Template

Do not store real credential exports in this repository. n8n credentials may contain API keys, OAuth refresh tokens, or passwords, and must remain in the encrypted n8n data volume on the local deployment machine.

After n8n is running locally, create credentials in its interface for each approved service. Use least-privilege scopes, name each credential clearly, and record only the non-secret metadata below in the project runbook.

| Credential | Purpose | Minimum scope or permission | Status |
|---|---|---|---|
| GitHub token or OAuth app | Read private automation repository and create controlled updates | Repository access limited to `automation-control-center` | Pending |
| Google Workspace OAuth | Access the specific Drive, Sheets, Docs, or other services used by a workflow | Start read-only; expand only for an approved workflow action | Pending |
| Gemini API key | Generate structured analysis or content within an n8n node | Restrict to the intended Google AI project and usage budget | Pending |
| External service key | Required only when a specific workflow is implemented | Use service-specific least privilege | Pending |

Never paste secrets into workflow notes, Git commits, issue comments, chat messages, or plain-text files. Use n8n's credential manager for stored secrets.
