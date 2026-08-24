# FinTrack - Historical Defect Patterns & Postmortems

## 1. Defect: Balance Deduction Race Condition Under High Concurrency
- **Title**: Double-Spend Ledger Inconsistency
- **Problem**: Users executing rapid duplicate transfers experienced balance deductions that occurred twice without proper ledger debit balance verification, allowing account balances to drop below zero.
- **Cause**: The balance check and balance decrement were executed as two separate non-atomic SQL queries without `SELECT ... FOR UPDATE` row locks.
- **Solution**: Wrapped the entire transaction in PostgreSQL row-level locks and added a database-level `CHECK (balance >= 0)` constraint on the accounts table.
- **Source**: `bug_reports.md`

## 2. Defect: JWT Token Expiration and Clock-Skew Edge Case
- **Title**: Silent Session Disconnection on Multi-Region Clusters
- **Problem**: Mobile app users were unexpectedly logged out immediately after logging in when communicating with secondary region server replicas.
- **Cause**: Server clock-skew (up to 45 seconds difference between nodes) caused `exp` claim validation to fail intermittently because `leeway` was set to 0.
- **Solution**: Configured a 60-second clock skew leeway on JWT verification and synchronized NTP server daemons across all cloud container nodes.
- **Source**: `bug_reports.md`

## 3. Defect: N+1 Query Performance Degradation on Dashboard Analytics
- **Title**: PostgreSQL Connection Exhaustion on Dashboard Load
- **Problem**: Fetching the user dashboard with 20 recent transactions triggered 21 distinct SQL roundtrips, causing connection pool exhaustion during traffic spikes.
- **Cause**: Lazy-loading foreign key relationships (`transaction.category` and `transaction.merchant`) inside a Python iteration loop instead of eager joining.
- **Solution**: Refactored SQLAlchemy queries to use `joinedload(Transaction.category)` and `selectinload(Transaction.tags)` to execute a single optimized query with Redis query result caching.
- **Source**: `bug_reports.md`
