# Cognis

Cognis is an organizational software engineering memory platform. It ingests engineering documents, extracts structured knowledge, and provides a grounded Assistant for architecture, requirements, debugging, code review, and planning questions.

## What Has Been Built

The current project is a functional local MVP with these capabilities:

- Project creation, selection, listing, and deletion
- Document upload for Markdown, text, JSON, YAML, PDF, and DOCX files
- Text extraction and document viewing
- LLM-based knowledge extraction with a deterministic Markdown fallback
- Searchable and category-filtered knowledge base
- Five Assistant modes with grounded source citations
- Project-scoped Assistant context and chat history
- Helpful and not-helpful response feedback with comments
- Dashboard metrics for projects, documents, knowledge, categories, and feedback
- LLM provider settings and API-key configuration
- OpenRouter support through its OpenAI-compatible API
- FinTrack sample project seeding and re-seeding
- Local SQLite persistence

## Application Workflow

```text
Start backend and frontend
        |
        v
Create a project or load FinTrack sample data
        |
        v
Upload engineering documents
        |
        v
Parse and store document text
        |
        v
Analyze the project
        |
        v
Extract architecture, standards, defects, lessons, and technologies
        |
        v
Browse and search the Knowledge Base
        |
        v
Ask project-scoped questions in the Assistant
        |
        v
Review source citations and submit feedback
        |
        v
Monitor results on the Dashboard
```

## Architecture

```text
frontend/
  React + TypeScript + Vite + Tailwind CSS
        |
        | HTTP JSON and multipart requests
        v
backend/
  FastAPI routers
        |
        v
  SQLAlchemy models and SQLite database
        |
        +--> Document parser
        +--> Knowledge extractor
        +--> Keyword-based RAG retrieval
        +--> LLM provider client
```

### Frontend

The frontend is located in `frontend/` and includes:

- `App.tsx`: application shell, navigation, dashboard refresh, and modal coordination
- `components/`: dashboard, projects, knowledge base, Assistant, feedback, settings, and viewers
- `api/client.ts`: frontend API client
- `types.ts`: shared TypeScript response types

### Backend

The backend is located in `backend/` and includes:

- `main.py`: FastAPI application startup and router registration
- `models.py`: SQLAlchemy database models
- `database.py`: database engine and session configuration
- `routers/`: API endpoints
- `services/parser.py`: uploaded-file parsing
- `services/extractor.py`: structured knowledge extraction
- `services/rag.py`: knowledge retrieval and grounded answer generation
- `services/llm_client.py`: provider integrations and fallback behavior

## Main Features

### Projects and Documents

Projects provide isolated workspaces for engineering documentation. A project starts in `Pending` status. Uploaded documents are stored with their filename, MIME type, size, parsed content, and project relationship.

Running project analysis removes stale extracted knowledge, processes every document, saves new knowledge items, and marks the project as `Analyzed`.

### Knowledge Categories

Extracted knowledge is normalized into five categories:

- `architecture`: design decisions, databases, integrations, scaling, and ADRs
- `standards`: coding, typing, error handling, logging, and transaction rules
- `defects`: bugs, symptoms, root causes, fixes, and prevention
- `lessons`: retrospective findings and future recommendations
- `technologies`: frameworks, databases, libraries, and tools

### Assistant and RAG

The Assistant first retrieves relevant `KnowledgeItem` records using keyword scoring. It then sends the selected context and the user question to the configured LLM.

Assistant responses include source citations containing:

- Knowledge item title
- Category
- Source document
- Content excerpt

The active project selector ensures that retrieval and chat history do not mix unrelated projects.

If no LLM provider is available, Cognis generates a deterministic response directly from retrieved knowledge.

### Supported LLM Providers

- Anthropic Claude
- OpenAI
- Google Gemini
- Groq
- OpenRouter

OpenRouter uses:

```text
https://openrouter.ai/api/v1
```

The current default OpenRouter model is:

```text
openai/gpt-4o-mini
```

## Configuration

Provider credentials belong in `backend/.env`:

```env
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=your-key-here

# Optional; defaults to local SQLite
# DATABASE_URL=sqlite:///./cognis.db
```

Never commit `.env` or place provider keys in the frontend. Restart the backend after changing environment variables.

If a real API key has been exposed, revoke or rotate it through the provider dashboard and create a replacement key.

## Running Locally

### Backend

```text
cd backend
pip install -r requirements.txt
python main.py
```

The API runs at:

```text
http://127.0.0.1:8000
```

Health check:

```text
http://127.0.0.1:8000/api/health
```

### Frontend

In a second terminal:

```text
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

The frontend currently expects the backend API at `http://127.0.0.1:8000/api`.

## Sample Data

Sample engineering documents are stored in `sample_docs/` and cover:

- FinTrack architecture decisions
- Coding standards
- Bug reports
- Lessons learned
- Technology choices

The sample project can be loaded from the dashboard/header or through:

```text
POST /api/sample-data/seed
```

## API Areas

The backend exposes endpoints for:

- `/api/health`
- `/api/projects`
- `/api/documents`
- `/api/knowledge`
- `/api/assistant`
- `/api/feedback`
- `/api/stats`
- `/api/sample-data`
- `/api/settings`

## Database Model

The SQLite database stores:

- `Project`
- `Document`
- `KnowledgeItem`
- `ChatMessage`
- `Feedback`
- `AppSetting`

Deleting a project cascades to its documents, knowledge items, chat messages, and related feedback.

## Validation Completed

The current implementation has been validated with:

```text
cd frontend
npm run build
```

```text
cd backend
python -m compileall -q .
```

The frontend build passes. The linter also completes, with non-blocking existing React hook and purity warnings.

## Current MVP Limitations

The following work is still recommended before production use:

1. Add automated backend API tests.
2. Make the selected provider control every LLM request explicitly.
3. Add project analysis error reporting and partial-failure status.
4. Add upload size, type, filename, and content validation.
5. Replace `Base.metadata.create_all()` with Alembic migrations.
6. Move the frontend API URL to a Vite environment variable.
7. Add consistent user-facing frontend error handling.
8. Move long-running analysis to a background job.
9. Add authentication and project authorization.
10. Use production secret management instead of database-stored API keys.
11. Add semantic/vector retrieval alongside keyword search.
12. Add Playwright end-to-end workflow tests.

For the detailed status and roadmap, see [documentation/IMPLEMENTATION_PLAN.md](documentation/IMPLEMENTATION_PLAN.md).
