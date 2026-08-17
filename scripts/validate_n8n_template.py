"""Validate the safe n8n workflow template without contacting any external service."""

import json
from pathlib import Path


WORKFLOW_PATH = Path("n8n/workflows/daily-automation-control-report.template.json")
REQUIRED_NODES = {"Daily Schedule", "Execute Workflow Trigger", "Create Control Report"}


def main() -> None:
    workflow = json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))
    names = {node["name"] for node in workflow["nodes"]}

    assert workflow["id"], "workflow must retain a stable identifier"
    assert workflow["active"] is False, "template must be inactive by default"
    assert REQUIRED_NODES <= names, "workflow is missing a required trigger or report node"

    for trigger_name in ("Daily Schedule", "Execute Workflow Trigger"):
        target = workflow["connections"][trigger_name]["main"][0][0]["node"]
        assert target == "Create Control Report", f"{trigger_name} must route to the report node"

    print("n8n workflow contract passed")


if __name__ == "__main__":
    main()
