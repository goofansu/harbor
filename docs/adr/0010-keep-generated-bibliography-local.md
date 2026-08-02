# ADR 0010: Keep the generated bibliography local to Harbor

- Status: Accepted
- Date: 2026-08-02

## Context

Harbor previously exported resolved reads and references to
`../notes/reference.bib`. This coupled Harbor's deterministic routing workflow
to one sibling repository and mixed generated Harbor blocks with bibliography
entries maintained by hand.

Emacs can consume more than one bibliography through
`org-cite-global-bibliography`, so Harbor can own its generated output directly.

## Decision

Use the repository-local `reference.bib` as the BibTeX adapter's default
destination. Keep `--bibliography <path>` as an explicit override.

Configure the citation client, rather than Harbor, to include this bibliography.
Existing resolved reads and references are re-exported locally so their routing
metadata identifies the new destination.

## Consequences

- Harbor's generated citation data is self-contained and portable with the
  repository.
- The notes bibliography remains independent of Harbor's generated blocks.
- Citation clients must include Harbor's `reference.bib` explicitly.
- Existing generated blocks in prior destinations are not deleted
  automatically.

## Amends

This decision changes the default destination described by ADR 0006 while
preserving the entry format and eligibility rules from ADRs 0006 and 0008.
