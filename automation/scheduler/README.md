# Scheduler

This directory is for scheduled automation jobs.

Planned responsibilities:

- collect track logs
- transform logs into normalized records
- write records into the target database
- integrate with crontab, `systemd`, or another scheduler outside the repo

Current entry point:

- `track_ingest.py`: a minimal Python skeleton for future track-log ingestion work
