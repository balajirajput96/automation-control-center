import json
import os
import sys
from urllib import error, request

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print(json.dumps({"ok": False, "error": "GEMINI_API_KEY is unavailable"}))
    sys.exit(2)

url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
payload = {
    "contents": [
        {
            "role": "user",
            "parts": [{"text": "Reply with exactly: automation-connector-ok"}],
        }
    ],
    "generationConfig": {"temperature": 0, "maxOutputTokens": 20},
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

try:
    with request.urlopen(req, timeout=30) as response:
        body = json.loads(response.read().decode("utf-8"))
        text = body["candidates"][0]["content"]["parts"][0]["text"].strip()
        print(json.dumps({"ok": True, "response": text}))
except error.HTTPError as exc:
    detail = exc.read().decode("utf-8", errors="replace")
    print(json.dumps({"ok": False, "status": exc.code, "error": detail[:500]}))
    sys.exit(1)
except Exception as exc:
    print(json.dumps({"ok": False, "error": str(exc)}))
    sys.exit(1)
