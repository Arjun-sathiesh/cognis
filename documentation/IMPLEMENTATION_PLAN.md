# Cognis Implementation Plan

## Current status

Cognis is a functional MVP for organizational software engineering memory.

| Area                 | Status           | Delivered behavior                                                             |
| -------------------- | ---------------- | ------------------------------------------------------------------------------ |
| Project management   | Complete         | Create, list, delete, and select projects                                      |
| Document ingestion   | Complete         | Upload Markdown, text, JSON/YAML, PDF, and DOCX files                          |
| Parsing              | Complete         | Extract readable text with binary/parser failure handling                      |
| Knowledge extraction | Complete         | LLM extraction with deterministic Markdown fallback                            |
| Knowledge base       | Complete         | Search, category filtering, detail inspection, and source links                |
| RAG assistant        | Complete         | Five operating modes, grounded citations, LLM fallback, project-scoped history |
| Feedback loop        | Complete         | Helpful/not-helpful feedback, comments, stats, and activity log                |
| Dashboard            | Complete         | Totals, category distribution, recent knowledge, recent projects               |
| Settings             | Complete         | Provider/API-key configuration through the settings API                        |
| Sample workflow      | Complete         | FinTrack documents, extraction, and reseeding endpoint                         |
| Validation           | Complete for MVP | Frontend production build and backend Python compilation pass                  |

## Completed in this pass

- Fixed the dashboard feedback response contract: `/api/stats/dashboard` now returns `feedback.helpfulness_rate`, matching the frontend type and rendering logic.
- Added a project-context selector to the assistant.
- Scoped assistant retrieval, saved messages, history loading, and history clearing to the selected project.
- Replaced the duplicate initial assistant-history request with a single project-aware load.

## Acceptance criteria

- `npm run build` in `frontend/` completes successfully.
- `python -m compileall -q .` in `backend/` completes successfully.
- A newly uploaded document changes its project to `Pending` until analysis is run.
- Running project analysis replaces stale extracted knowledge and reports the extracted item count.
- Assistant citations link back to inspectable knowledge items.
- Switching assistant project changes both the searchable knowledge context and visible chat history.
- Feedback updates are reflected in the dashboard and feedback page.
- Starting the backend with an empty database creates the sample FinTrack project.

## Next production hardening milestones

1. Add automated API tests for project/document lifecycle, extraction fallback, RAG project isolation, feedback validation, and cascading deletes.
2. Add a real migration workflow with Alembic; `Base.metadata.create_all` is suitable for the MVP but should not manage production schema evolution.
3. Move `API_BASE` to a Vite environment variable and add a consistent API error model for user-facing error messages.
4. Replace synchronous analysis with a background job for large document sets and expose progress/error state in the UI.
5. Add authentication and authorization before exposing project data outside a trusted local environment.
6. Add upload size/type limits, content validation, rate limiting, structured logging, and secret redaction.
7. Add semantic/vector retrieval and evaluation fixtures once the knowledge corpus is large enough for lexical matching to become insufficient.
8. Add Playwright coverage for the ingestion, analysis, knowledge inspection, assistant, feedback, and settings workflows.

## Run locally

Backend:

```text
cd backend
pip install -r requirements.txt
python main.py
```

Frontend:

```text
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://127.0.0.1:8000/api`.
