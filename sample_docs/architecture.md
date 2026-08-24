# FinTrack - Architecture & System Design

## 1. System Overview
FinTrack is a high-throughput personal finance management and wealth tracking platform. The system ingests bank transactions, performs automated categorization, detects anomaly spending, and generates real-time net-worth forecasts.

## 2. Core Architecture Decisions

### ADR-001: Primary Database Selection (PostgreSQL)
- **Decision**: Selected PostgreSQL 15 as the primary relational database instead of MongoDB.
- **Rationale**: Financial ledger integrity demands strict ACID compliance, relational foreign-key consistency between Accounts, Transactions, and Categories, and rock-solid transaction isolation levels (Serializable / Read Committed) to prevent double-spending anomalies and phantom ledger reads.
- **Source**: `architecture.md`

### ADR-002: Modular Monolith over Microservices
- **Decision**: Built the core system as a modular monolith in FastAPI/Python rather than distributed microservices.
- **Rationale**: For our team size (4-6 engineers) and domain stage, a modular monolith minimizes network latency, eliminates distributed transaction overhead (Saga complexity), and provides simplified end-to-end testing while keeping bounded contexts strictly separated in code packages (`accounts`, `ledger`, `analytics`, `auth`).
- **Source**: `architecture.md`

### ADR-003: Authentication & Token Management
- **Decision**: Implemented JWT (JSON Web Tokens) with asymmetric RS256 signing combined with Redis-backed Refresh Token Rotation (RTR).
- **Rationale**: Stateless short-lived Access Tokens (15-minute expiration) reduce database lookup overhead on high-frequency API calls. Refresh tokens (7-day validity) are single-use and rotated on every issuance; if a previously used refresh token is presented, all user sessions are immediately revoked to prevent token replay attacks.
- **Source**: `architecture.md`

### ADR-004: In-Memory Caching Strategy
- **Decision**: Redis 7 is utilized for rate-limiting, session revocation blacklists, and caching currency conversion exchange rates with a 60-second TTL.
- **Rationale**: Protects external third-party FX rate APIs from rate limits and reduces response latency on portfolio calculation endpoints from 380ms to 12ms.
- **Source**: `architecture.md`

## 3. Technology Stack Summary
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0 (Async), Alembic
- **Database**: PostgreSQL 15, Redis 7
- **Frontend**: React 18, TypeScript, Tailwind CSS, TanStack Query
- **Security**: OAuth2 / OIDC, RS256 JWT, Argon2id password hashing
- **Source**: `architecture.md`
