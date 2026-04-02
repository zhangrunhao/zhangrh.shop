# Automation

`automation/` is the root-level automation area for the repository.

Current split:

- `publish/`: interactive release helpers used from the repo root.
- `scheduler/`: scheduled jobs and log-ingest scripts, implemented in Python.

Boundary:

- Keep product runtime code in `frontend/` and `backend/`.
- Keep orchestration, deployment helpers, and scheduled batch jobs in `automation/`.
- If a scheduled job contains reusable business logic, move that logic into `backend/` and let `automation/` only trigger it.
