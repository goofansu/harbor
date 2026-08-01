# ADR 0002: Provenance-aware YAML frontmatter

- Status: Accepted
- Date: 2026-08-01

## Context

The initial flat item schema placed source facts, fetched evidence, generated
analysis, and user decisions at the same level. A reader could not determine
from the markdown file alone whether a value came from the page, Firecrawl,
Harbor's reasoning, or the user.

Several fields are inherently contextual. Novelty and related items depend on
the inbox at review time, while summaries and reading-time estimates are
derived rather than source facts. Harbor also intentionally does not archive
raw fetched content.

## Decision

Continue using YAML frontmatter in markdown item files, but group fields by
provenance and responsibility:

- `source`: URL and facts represented by the page,
- `capture`: the intake event and actor,
- `fetch`: retrieval provider, time, and raw-content retention status,
- `analysis`: Harbor-generated and contextual judgments,
- `resolution`: recommendation, terminal decision, deciding actor, and reason.

Use `raw_content_stored: false` to make the non-archival boundary explicit.
Record the exact source title separately from Harbor's normalized
`analysis.display_title`.

Migrate existing flat records during their next review. Do not bulk-rewrite
resolved history without re-examining its provenance.

## Consequences

Benefits:

- source evidence and inference are visibly distinct,
- fetch and analysis freshness can be evaluated separately,
- recommendations are distinguishable from user decisions,
- records are easier to audit, correct, and migrate to a future service,
- Harbor's decision not to retain raw articles is explicit.

Tradeoffs:

- frontmatter is longer,
- agents must maintain section boundaries consistently,
- legacy and grouped records coexist until reviewed,
- YAML values still require careful quoting and eventual validation.

## Alternatives considered

TOML would provide stricter configuration syntax, but Harbor items are content
documents with nested metadata, lists, and optional notes. YAML frontmatter is
more natural for this use.

Per-field provenance annotations would be more precise, but would duplicate
field names and add unnecessary maintenance cost during the markdown MVP.

## Amendment

ADR 0004 replaces `fetch.raw_content_stored` with `fetch.formats` and a
dedicated `preservation` group. This distinguishes retrieval from intentional
post-resolution source preservation.

ADR 0005 records a non-empty author metadata string returned by Firecrawl as
`source.author`. The value remains source evidence: Harbor stores it verbatim,
does not infer a missing author, and keeps it separate from generated analysis.

ADR 0007 removes the `preservation` group from the active item schema. Existing
records migrate by dropping that obsolete group when next edited.
