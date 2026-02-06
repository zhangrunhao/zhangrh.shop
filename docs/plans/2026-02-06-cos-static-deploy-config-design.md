# COS Static Deploy Config Hardcode Design

## Goal

Hardcode non-secret deployment settings in the deploy script so that only COS credentials remain as environment variables.

## Scope

- Replace env-driven `COS_BUCKET`, `COS_REGION`, `COS_PREFIX`, `BUILD_DIR`, `CDN_BASE_URL` with script constants.
- Keep `COS_SECRET_ID` and `COS_SECRET_KEY` as environment variables.
- No changes to test expectations or helper behavior.

## Design

### Configuration Strategy

Define constants near the top of `frontend/scripts/deploy-static.mjs`:

- `COS_BUCKET` (string)
- `COS_REGION` (string)
- `COS_PREFIX` (string, can be empty)
- `BUILD_DIR` (string, default build output path)
- `CDN_BASE_URL` (string, optional CDN domain)

These values replace the current `process.env` lookups. The secrets remain loaded from `process.env` and validated via the existing `must()` checks.

### Behavior

- Upload logic and helper functions remain unchanged.
- `ENTRY_URL` uses `CDN_BASE_URL` if present; otherwise the COS default domain.
- `COS_PREFIX` continues to prefix both object keys and the final `ENTRY_URL` path.

### Error Handling

- Missing `COS_SECRET_ID` / `COS_SECRET_KEY` still cause early exit with a clear error message.
- Missing or empty build directory still exits as before.

### Testing

- Existing unit tests remain valid; no new tests required.

## Out of Scope

- Loading configuration from `.env` files.
- Runtime flags or CLI arguments for configuration overrides.
