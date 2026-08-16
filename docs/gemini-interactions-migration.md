# Gemini Interactions API Migration Notes

The official Gemini API documentation recommends the **Interactions API** for new development and access to current models. The REST endpoint is `POST https://generativelanguage.googleapis.com/v1beta2/interactions` with `Content-Type: application/json` and the API key supplied in the `x-goog-api-key` header. A minimal text request sends a JSON body with `model`, `input`, and, for a stateless health check, `store: false`.

```json
{
  "model": "gemini-3.6-flash",
  "input": "Reply with exactly: automation-connector-ok",
  "store": false
}
```

A successful response includes a `steps` array. The response text is found in a completed `model_output` step, in that step’s `content` entries where `type` equals `text`. The documentation lists `gemini-3.6-flash` as a supported Interactions API model and notes that `store: false` prevents server-side interaction storage.

## References

[1]: https://ai.google.dev/gemini-api/docs/migrate-to-interactions "Migrating to the Interactions API — Google AI for Developers"
[2]: https://ai.google.dev/gemini-api/docs/interactions-overview "Interactions API Overview — Google AI for Developers"
