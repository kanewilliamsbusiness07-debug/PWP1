# Changelog

## Unreleased

### Added
- ci: Add `integration-localstack` GitHub Actions job to run DDB+S3 integration tests against LocalStack
- test: Add `__tests__/pdf-exports.integration.test.ts` to cover PDF export create/list/download flows with mocked AWS

### Changed
- ci: Bump Node version in CI jobs to 20 to match project engine requirement

### Notes
- The new integration job starts a LocalStack container, creates required S3/DynamoDB resources, and runs the test suite. Ensure any production secrets remain in GitHub Secrets and are not used in the LocalStack job.
