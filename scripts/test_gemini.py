import json
import os
import sys
from urllib import error, request

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print(json.dumps({"ok": False, "error": "GEMINI_API_KEY is unavailable"}))
    sys.exit(2)

url = "https://generativelanguage.googleapis.com/v1beta/interactions"
payload = {
    "model": "gemini-3.6-flash",
    "input": "Reply with exactly: automation-connector-ok",
    "store": False,
}

req = request.Request(
    url,
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    },
    method="POST",
)


def extract_output_text(body: dict) -> str:
    for step in reversed(body.get("steps", [])):
        if step.get("type") != "model_output":
            continue
        text_parts = [
            content.get("text", "").strip()
            for content in step.get("content", [])
            if content.get("type") == "text" and content.get("text")
        ]
        if text_parts:
            return "\n".join(text_parts)
    raise ValueError("No completed text output was returned by the Interactions API")


try:
    with request.urlopen(req, timeout=30) as response:
        body = json.loads(response.read().decode("utf-8"))
        print(json.dumps({"ok": True, "response": extract_output_text(body)}))
except error.HTTPError as exc:
    detail = exc.read().decode("utf-8", errors="replace")
    print(json.dumps({"ok": False, "status": exc.code, "error": detail[:500]}))
    sys.exit(1)
except Exception as exc:
    print(json.dumps({"ok": False, "error": str(exc)}))
    sys.exit(1)
