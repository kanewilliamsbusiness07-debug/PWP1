### Summary

This PR adds a LocalStack-based integration job to the CI pipeline and introduces integration tests to validate DDB + S3 PDF export flows.

### Changes
- Add `integration-localstack` job to `.github/workflows/ci.yml` which:
  - Starts LocalStack (S3 + DynamoDB), creates a placeholder bucket and a `fincalc-pdf-exports` table.
  - Runs the test suite against the LocalStack endpoint.
- Add `__tests__/pdf-exports.integration.test.ts` covering create/list/download flows (mocked AWS clients).
- Bump Node version in CI jobs to 20.
- Add `CHANGELOG.md` with an Unreleased entry.

### Testing
- Local test run: `npm test` — all tests pass locally (94 tests).

### Notes
- The LocalStack job uses placeholder resource names and test AWS credentials (test/test) — safe for CI use.
- If you want me to open the PR for you, I can create it now (requires GitHub CLI or token). Otherwise the branch `ci/add-localstack-integration` is pushed and ready: https://github.com/kanewilliamsbusiness07-debug/PWP1/pull/new/ci/add-localstack-integration
