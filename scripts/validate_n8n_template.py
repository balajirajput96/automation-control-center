"""Validate the safe n8n workflow template without contacting any external service."""

import json
from pathlib import Path


WORKFLOW_PATH = Path("n8n/workflows/daily-automation-control-report.template.json")
IMPORT_READY_DIR = Path("n8n/import-ready")
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

    import_files = []
    for candidate_path in sorted(IMPORT_READY_DIR.glob("*.json")):
        candidate = json.loads(candidate_path.read_text(encoding="utf-8"))
        if isinstance(candidate, dict) and "nodes" in candidate:
            import_files.append(candidate_path)
    assert import_files, "at least one sanitized workflow must be staged for import"

    for import_file in import_files:
        candidate = json.loads(import_file.read_text(encoding="utf-8"))
        assert candidate["active"] is False, f"{import_file.name} must be inactive"
        assert candidate.get("meta", {}).get("importSafety") == "credentials-removed-and-write-capable-nodes-disabled", (
            f"{import_file.name} is missing its import safety marker"
        )
        for node in candidate.get("nodes", []):
            assert "credentials" not in node, f"{import_file.name} contains node credentials"
            assert node.get("disabled") is True, f"{import_file.name} has an enabled node: {node.get('name')}"

    print(f"n8n workflow contract passed ({len(import_files)} inactive import templates checked)")


if __name__ == "__main__":
    main()
