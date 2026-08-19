# Agent Instructions

## Read Order

1. Read `docs/README.md`.
2. Read the relevant files in `docs/current/`.
3. Check `docs/changes/` for an existing Change on the same topic.
4. Verify documentation against code, tests, builds, or fresh external evidence.

## Documentation Governance

- Treat `docs/current/` as the concise source of current public project facts and effective decisions.
- Store active specifications and plans as flat `YYYY-MM-DD-topic-spec.md` and `YYYY-MM-DD-topic-plan.md` files in `docs/changes/`.
- Update affected current documents before moving completed or cancelled Change files to `docs/archive/`.
- Store completed public investigations, release records, deployment-contract decisions, superseded documents, and other finished material in the flat `docs/archive/` directory.
- Keep runbooks and component READMEs procedural or component-local; link to `docs/current/` for cross-component current facts instead of duplicating them.
- Prefer current code, tests, builds, and fresh external verification over documentation.
- Include a verification date for changing external state; otherwise mark it unverified.

## Public and Private Boundaries

- Keep public code behavior, interfaces, validation, and deployment contracts in this repository.
- Keep infrastructure inventory, concrete production configuration, and private external verification in `docs/private.local/` when that independent repository is available.
- Public documentation must remain understandable without `docs/private.local/`.
- Never store passwords, private keys, tokens, access keys, database credentials, or actual `.env` values in either documentation repository.
- Check and commit the public and private repositories separately.

## Verification

- Use Node.js 24.
- Run `npm test` for behavior-preserving documentation changes that affect project instructions or contracts.
- Run `npm run check` for code changes or changes that affect build, lint, type, or release behavior.
- Run `git diff --check` and verify local Markdown links and heading anchors before completion.

## Safety

- Do not publish, alter production infrastructure, write production data, or perform irreversible cleanup without explicit authorization.
- Treat production, App Store, TestFlight, DNS, certificate, and cloud-console state as unverified unless checked in the current task.
