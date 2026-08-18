# Julius Scheduled Analysis Prompt

Run this analysis once each business day after the source dataset has refreshed. Analyze the connected dataset for newly available records, material changes, anomalies, and trends relevant to the selected automation objective.

## Output Destination

Save and deliver the generated analysis report to the existing private Google Drive destination folder:
- **Destination Service**: Google Drive (Private)
- **Folder Name**: `Automation Control Center`
- **Folder ID**: `18l-M8C00XpE6l3kxn1tSkp6vNi0SJcOR`
- **File Naming Convention**: `julius-analysis_YYYY-MM-DD.json` or `julius-analysis_YYYY-MM-DD.md`

## Structured Output Contract

The analysis output must conform to the following structured contract (as JSON or structured Markdown):

### Structured Output Schema
```json
{
  "report_metadata": {
    "reporting_period": "string (e.g. YYYY-MM-DD to YYYY-MM-DD)",
    "source_dataset_name": "string",
    "execution_timestamp": "ISO-8601 string",
    "assumptions": ["string"]
  },
  "data_freshness": {
    "last_data_refresh": "ISO-8601 string",
    "records_analyzed": 0,
    "freshness_status": "fresh | delayed | stale"
  },
  "key_findings": [
    {
      "metric": "string",
      "summary": "string",
      "impact": "low | medium | high"
    }
  ],
  "anomalies": [
    {
      "metric": "string",
      "observation": "string",
      "severity": "low | medium | high"
    }
  ],
  "trend_changes": [
    {
      "dimension": "string",
      "direction": "up | down | stable | volatile",
      "context": "string"
    }
  ],
  "recommended_follow_ups": [
    {
      "action": "string",
      "rationale": "string",
      "requires_approval": true
    }
  ],
  "data_quality_concerns": [
    {
      "field_or_table": "string",
      "issue_type": "missing_values | duplicates | schema_mismatch | outlier",
      "detail": "string"
    }
  ]
}
```

### Contract Requirements
- Include the reporting period, source dataset name, execution timestamp, and any assumptions.
- Must include all 6 mandatory sections: `data freshness`, `key findings`, `anomalies`, `trend changes`, `recommended follow-ups`, and `data quality concerns`.
- Do not edit the source data, create external accounts, send messages, or share reports until a destination and approval rule have been configured.

## Configuration Parameters

Before enabling the schedule, verify the configuration values below:

| Setting | Required value |
|---|---|
| Dataset | The exact Julius dataset, notebook, or connected data source |
| Business objective | The decision, report, or metric this analysis serves |
| Reporting time | Local daily run time (e.g. 08:30 local) |
| Delivery destination | Google Drive: `Automation Control Center` (`18l-M8C00XpE6l3kxn1tSkp6vNi0SJcOR`) |
| Human review rule | The person or condition that approves follow-up actions |
