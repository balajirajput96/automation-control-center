# Julius Scheduled Analysis Prompt

Run this analysis once each business day after the source dataset has refreshed. Analyze the connected dataset for newly available records, material changes, anomalies, and trends relevant to the selected automation objective.

Return a concise report containing: `data freshness`, `key findings`, `anomalies`, `trend changes`, `recommended follow-ups`, and `data quality concerns`. Include the reporting period, the source dataset name, and any assumptions. Do not edit the source data, create external accounts, send messages, or share reports until a destination and approval rule have been configured.

Before enabling the schedule, replace the placeholder values below:

| Setting | Required value |
|---|---|
| Dataset | The exact Julius dataset, notebook, or connected data source |
| Business objective | The decision, report, or metric this analysis serves |
| Reporting time | Local daily run time |
| Delivery destination | A chosen Julius, email, Slack, or approved document destination |
| Human review rule | The person or condition that approves follow-up actions |
