# Cognis Test Cases

This directory is reserved for Cognis validation assets.

## Planned Coverage

- Project creation, listing, selection, and deletion
- Document upload, parsing, viewing, and deletion
- Knowledge extraction and deterministic fallback behavior
- Project analysis status and extracted item counts
- Project-scoped Assistant retrieval and chat history
- Source citation inspection
- Helpful and not-helpful feedback submission
- Dashboard and settings API responses
- Sample FinTrack seeding
- End-to-end frontend workflows

## Suggested Layout

```text
testcases/
  api/       Backend API tests
  fixtures/  Reusable sample payloads and documents
  e2e/       Playwright browser tests
```

Backend tests should use `pytest` and `httpx`. Browser tests should use Playwright against the local FastAPI and Vite services.
