# ADR 0015: Remove legacy saves

- Status: Accepted
- Date: 2026-08-07

## Context

ADR 0014 stopped Harbor from staging or saving raw source bodies but initially
preserved article files created by the former `read` workflow. Those files no
longer served an active Harbor behavior, while their bibliography `file` fields
suggested that Harbor still owned a reading archive.

## Decision

Remove the `saves/` directory and all former saved article files. Re-export
study bibliography entries as URL-only records so no generated entry points to
the removed paths.

Harbor must not recreate `saves/` or another raw-content archive. A guided-study
workspace may consult sources when teaching begins, but it owns its artifacts
outside Harbor.

## Consequences

- Harbor retains no raw source bodies.
- Bibliography entries provide provenance URLs without local attachments.
- Deleted tracked save files remain recoverable from repository history.

## Amends

This decision amends ADR 0014's initial legacy-data treatment and completes the
removal of the saved-reading behavior introduced by ADR 0011.
