"""Normalize staged n8n import templates to the repository's inactive safety contract."""

import json
from pathlib import Path


IMPORT_READY_DIR = Path("n8n/import-ready")
SAFETY_MARKER = "credentials-removed-and-write-capable-nodes-disabled"


def main() -> None:
    changed_files = 0

    for workflow_path in sorted(IMPORT_READY_DIR.glob("*.json")):
        workflow = json.loads(workflow_path.read_text(encoding="utf-8"))
        if not isinstance(workflow, dict) or "nodes" not in workflow:
            continue
        changed = False

        if workflow.get("active") is not False:
            workflow["active"] = False
            changed = True

        meta = workflow.setdefault("meta", {})
        if meta.get("importSafety") != SAFETY_MARKER:
            meta["importSafety"] = SAFETY_MARKER
            changed = True

        for node in workflow.get("nodes", []):
            if node.pop("credentials", None) is not None:
                changed = True
            if node.get("disabled") is not True:
                node["disabled"] = True
                changed = True

        if changed:
            workflow_path.write_text(json.dumps(workflow, indent=2) + "\n", encoding="utf-8")
            changed_files += 1

    print(f"normalized {changed_files} staged n8n import templates")


if __name__ == "__main__":
    main()
