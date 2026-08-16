# Daily Automation Review Prompt

Review this repository and produce a structured daily automation health report. First inspect the repository state, documentation, deployment files, workflow definitions, and recent changes. Then run only the existing read-only or validation commands that are explicitly allowed by the workspace rules.

The report must contain these sections: `repository_health`, `n8n_deployment_readiness`, `workflow_issues`, `integration_blockers`, `test_results`, `recommended_changes`, and `risk_flags`. Each recommendation must include the affected path, a short rationale, a risk level of `low`, `medium`, or `high`, and whether it can be applied automatically.

Do not send messages, modify credentials, expose network ports, make purchases, publish a public repository, merge a pull request, delete data, or create external accounts. Do not edit files in this run. Report proposed changes only. Return valid JSON matching the schema supplied by the scheduled runner.
