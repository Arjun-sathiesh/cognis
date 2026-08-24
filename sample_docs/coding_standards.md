# FinTrack - Engineering Coding Standards & Guidelines

## 1. API Design & Error Handling Standards
- **Standard**: Standardized RFC 7807 Problem Details JSON format for all error responses.
- **Rule**: Never return bare strings or raw unhandled tracebacks in 500 error responses. All endpoints must return `{"error_code": "ERR_NAME", "message": "Human readable summary", "details": {}, "timestamp": "ISO-8601"}`.
- **Explanation**: Prevents leaking internal database credentials/stack traces to clients and provides deterministic error codes for mobile and web frontend error boundaries.
- **Source**: `coding_standards.md`

## 2. Database Transaction Isolation & Lock Wrappers
- **Standard**: Explicit context managers for atomic operations modifying balances.
- **Rule**: All ledger balance modifications must use `SELECT ... FOR UPDATE` row-level locks or optimistic version checks inside an async transaction block `async with db.begin():`.
- **Explanation**: Prevents race conditions where two simultaneous payment webhook requests read the same balance and concurrently deduct funds.
- **Source**: `coding_standards.md`

## 3. TypeScript Strict Type Discipline
- **Standard**: Zero tolerance for `any` type annotations in frontend codebase.
- **Rule**: All API responses must be typed via auto-generated OpenAPI TypeScript schemas. `strictNullChecks` and `noImplicitAny` must remain enabled in `tsconfig.json`.
- **Explanation**: Eliminates runtime `TypeError: Cannot read properties of undefined` in client-side financial charts and table computations.
- **Source**: `coding_standards.md`

## 4. Logging and Telemetry
- **Standard**: Structured JSON logging with Correlation IDs.
- **Rule**: Inject `X-Correlation-ID` header into every request context; all logs must output JSON with `correlation_id`, `user_id`, `service`, and `latency_ms`. Never log PII (credit card numbers, bank account numbers, passwords).
- **Explanation**: Enables distributed tracing and compliance with PCI-DSS data privacy regulations.
- **Source**: `coding_standards.md`
