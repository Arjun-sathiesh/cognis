# FinTrack - Engineering Retrospective & Lessons Learned

## 1. Lesson: Distributed Lock Necessity for Payment Provider Webhooks
- **Title**: Payment Webhook Idempotency
- **Lesson**: Payment gateway providers (Stripe, Plaid) can retry webhook notifications up to 5 times if network latency exceeds 3000ms. Non-idempotent handlers result in duplicate credit events.
- **Recommendation**: Always enforce an idempotency key cache in Redis with a 24-hour TTL and wrap external webhook processing in a distributed Redis lock before updating internal account states.
- **Source**: `lessons_learned.md`

## 2. Lesson: Sizing Database Connection Pools for Async FastAPI
- **Title**: Async SQLAlchemy Pool Sizing
- **Lesson**: Setting `pool_size` too high (e.g. 50 per worker on 4 workers = 200 connections) overwhelmed PostgreSQL's memory buffers and caused server CPU thrashing.
- **Recommendation**: Cap connection pools at `pool_size=15`, `max_overflow=5` per worker and deploy PgBouncer connection pooling proxy for transaction-level pooling.
- **Source**: `lessons_learned.md`

## 3. Lesson: Automated Test Fixture Data Hygiene
- **Title**: Test Database Isolation
- **Lesson**: Flaky CI test suites resulted from tests writing to shared mock tables without rolling back transaction state.
- **Recommendation**: Use nested database savepoints (`session.begin_nested()`) for every individual test case so each test automatically rolls back upon teardown without recreating tables.
- **Source**: `lessons_learned.md`
