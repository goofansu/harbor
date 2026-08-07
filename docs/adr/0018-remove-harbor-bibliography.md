# ADR 0018: Remove Harbor bibliography

- Status: Accepted
- Date: 2026-08-07

## Context

Harbor already preserves the selected source URL and structured analysis in
each resolved study record. The external teaching workspace then curates the
sources actually used for learning in `RESOURCES.md`.

The generated `reference.bib`, citation keys, and bibliography-routing state
duplicate those records without an active downstream citation consumer. They
also imply that Harbor owns durable reference management, which is outside its
temporary triage boundary.

## Decision

Remove automatic BibTeX export, the `harbor:bibtex` command, the generated
`reference.bib`, and `routing.bibliography` from active and tracked records.

Resolve `study` by preserving the source metadata and optionally recording the
external workspace handoff in `routing.study`. Let each teaching workspace own
resource selection and annotation through `RESOURCES.md`.

Keep older ADRs and session descriptions unchanged as historical records.

## Consequences

- Harbor has one downstream route: the external study workspace.
- Selected source metadata is no longer duplicated in a generated bibliography.
- Teaching workspaces decide which sources genuinely contributed to learning.
- A future citation workflow must be introduced by its actual consumer rather
  than provisioned speculatively by Harbor.

## Supersedes

This decision supersedes ADRs 0006, 0008, and 0010 and the bibliography behavior
retained by ADR 0014.
