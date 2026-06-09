# Proposal: init-all-resilience

## Problem
`forte init all` currently fails the entire batch when any single tool config file is missing. This is because:
1. `src/lib/init.ts`'s `initAll` throws on missing config paths and counts them as failures
2. The integration test calls `initAll` with the full `tools-registry.json` sweep, hitting 5 missing configs and triggering `process.exit(1)`
3. Unit/integration tests don’t mock `process.exit`, so Jest aborts

## Proposed Changes

### 1. Make initAll resilient to missing configs
- **File**: `src/lib/init.ts`
- **Change**: When a tool config path does not exist, treat it as a no-op (`applied: 0`, success) instead of throwing
- **Behavior**: Missing configs are skipped gracefully; existing configs still get backed up and initialized

### 2. Mock process.exit in tests
- **Files**: `tests/unit/*.test.ts`, `tests/integration/*.test.ts`
- **Change**: Add `process.exit = jest.fn() as any;` in `beforeEach` or shared setup
- **Behavior**: Tests can assert on exit calls without terminating Jest

### 3. Fix integration test scope
- **File**: `tests/integration/init-integration.test.ts`
- **Change**: Use isolated test fixtures (`tests/fixtures/`) instead of relying on system-wide tool registry paths
- **Behavior**: Integration tests run deterministically on any machine

### 4. Add missing fixture
- **File**: `tests/fixtures/empty-tools-registry.json`
- **Change**: Create minimal fixture for tests that don’t need full registry
- **Behavior**: Tests can use lightweight fixtures

## Impact
- **User-facing**: `forte init all` becomes more robust on fresh machines or partial installs
- **Testing**: All test suites pass without environment-dependent failures
- **Breaking**: None — this is a resilience improvement

## Acceptance Criteria
1. `npm test` passes all unit, integration, and e2e suites
2. `initAll` with missing tool configs exits with code 0 and reports `applied: 0`
3. Existing configs still get backed up and initialized correctly
