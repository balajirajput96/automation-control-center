# Safe n8n Import Bundle

This directory contains **12 credential-free, inactive n8n workflow templates** derived from the uploaded workflow archives. Each template has `active: false`, any credential references removed, and write-capable, webhook, trigger, or external-integration nodes disabled where applicable.

Import the templates only after the target n8n Cloud workspace is available. Attach credentials manually to the minimum required nodes, review all disabled nodes, and keep the workflow inactive until a separate execution boundary has been approved.

`import-register.json` identifies each original source, the sanitized import file, and the nodes disabled during preparation. No API keys, passwords, tokens, webhook IDs, or browser-session material are included in this bundle.
