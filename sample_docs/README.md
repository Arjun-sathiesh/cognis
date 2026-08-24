# FinTrack - Personal Finance Management System

FinTrack is an engineering project designed for multi-account wealth aggregation, automated transaction classification, and predictive cash flow budgeting.

## Core Capabilities
- Ingestion of banking feeds (Open Banking & Plaid APIs)
- Real-time ledger accounting with ACID transactional guarantees
- Anomaly spending detection using ML inference
- Interactive React dashboard with visual cashflow projection charts

## Tech Stack
- **API Server**: Python 3.11, FastAPI, Uvicorn
- **Persistence**: PostgreSQL 15, Redis 7
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Testing**: Pytest, Playwright, FactoryBoy
- **Observability**: Prometheus, Grafana, OpenTelemetry

## Architecture Summary
FinTrack follows a domain-driven modular monolith pattern with explicit service boundaries between `accounts`, `ledger`, `budgets`, and `notifications`.
