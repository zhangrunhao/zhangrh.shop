# Automation

`automation/` is the root-level automation area for the repository.

Current split:

- `publish/`: interactive release helpers used from the repo root.
- `scheduler/`: scheduled jobs and log-ingest scripts, implemented in Python.

Boundary:

- Keep product runtime code in `frontend/` and `backend/`.
- Keep orchestration, deployment helpers, and scheduled batch jobs in `automation/`.
- If a scheduled job contains reusable business logic, move that logic into `backend/` and let `automation/` only trigger it.

Deployment boundary:

- Frontend runtime files are published to `/opt/zhangrh-shop/site` on the main server.
- Backend runtime files are published to `/opt/zhangrh-shop/backend` and run by Docker Compose.
- Automation scripts may upload files and trigger `docker compose`, but they should not contain product runtime logic.
