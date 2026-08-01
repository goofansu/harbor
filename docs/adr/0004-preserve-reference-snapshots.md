# ADR 0004: Preserve source snapshots for references

- Status: Superseded by ADR 0007
- Date: 2026-08-01

## Context

Firecrawl can return a cleaned Markdown representation of a page in addition to
structured metadata and generated summaries. Harbor previously treated all
fetched content as temporary evidence and retained only derived context.

A `reference` decision means the source has durable value. Keeping only its URL
leaves that decision vulnerable to link rot and source changes. Preserving every
captured or reviewed page, however, would turn Harbor into an indiscriminate
archive.

## Decision

Make source-snapshot preservation a required consequence of the `reference`
terminal decision. Do not preserve full content during capture or review.

Preserve cleaned main-content Markdown, including text, headings, code blocks,
and links. Do not download images or other page assets during the MVP.

For the local MVP, use `exports/reference/` as the outbound adapter for the
destination reference system. Snapshots are immutable and use timestamped
filenames. A later maintenance review creates a new version rather than
overwriting an existing snapshot.

Record preservation separately from retrieval:

```yaml
fetch:
  provider: "firecrawl"
  fetched_at: "..."
  formats:
    - "markdown"
preservation:
  required: true
  status: "complete"
  format: "markdown"
  destination: "exports/reference/..."
  preserved_at: "..."
  source_fetched_at: "..."
  content_hash: "sha256:..."
```

Use preservation statuses `not_applicable`, `pending`, `complete`, and
`failed`. Mark preservation complete only after the destination exists and a
SHA-256 hash is recorded.

## Consequences

Benefits:

- references survive link rot and source changes,
- preservation cost is paid only after triage establishes durable value,
- the distinction between retrieval and retention remains explicit,
- immutable snapshots support later comparison and audit,
- the local adapter can be replaced by an external reference integration.

Tradeoffs:

- reference resolution now requires an additional fetch and export step,
- snapshot storage grows with the number of references and versions,
- cleaned Markdown is not a perfect archival representation,
- images and other assets can still disappear,
- source rights and destination policies must be respected.

## Revisit when

Reconsider asset preservation or richer archival formats only if text-first
snapshots prove insufficient for retained reference value.

## Amendment

ADR 0005 replaces the ambiguous `content_hash` with `body_hash`, computed from
normalized Markdown for change and idempotency detection, and `artifact_hash`,
computed from the complete snapshot file for integrity. It also makes the
official Firecrawl SDK and atomic file operations the deterministic
preservation path.

ADR 0007 removes snapshot preservation from Harbor after the workflow proved
more complex than the value it added.
