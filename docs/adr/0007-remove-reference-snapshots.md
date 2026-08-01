# ADR 0007: Remove reference snapshots

- Status: Accepted
- Date: 2026-08-01

## Context

Harbor introduced cleaned Markdown snapshots as a required consequence of a
`reference` decision. In practice, the extra preservation state, direct
Firecrawl SDK integration, proxy-cost policy, hashes, immutable versions, and
export filenames duplicated the identity of one logical reference.

Firecrawl output can also change for reasons unrelated to durable content,
including formatting and live engagement counters. Treating every byte change
as a new immutable export produced multiple snapshots for one reference and
made metadata refresh unexpectedly create content versions.

Harbor is a temporary decision queue, while the user's notes and bibliography
already provide the deliberate promotion boundary for downstream knowledge.
Snapshot archival is outside the smallest useful Harbor workflow.

## Decision

Remove source-snapshot preservation from Harbor.

- A resolved `reference` is represented by its Harbor Markdown item.
- Harbor retains source metadata, analysis, resolution, maintenance, and
  bibliography-routing state, but not the fetched page body.
- Firecrawl MCP may provide temporary review context and source metadata.
- Harbor no longer uses the direct Firecrawl SDK, preservation scripts,
  preservation status fields, hashes, or `exports/reference/` as an active
  adapter.
- The BibTeX adapter accepts a resolved reference directly.
- Historical snapshot files remain inert and are not read or updated by the
  active workflow.

## Consequences

Benefits:

- one logical Harbor record represents one reference,
- metadata refresh cannot create duplicate content exports,
- the direct SDK, credit-escalation flow, hashes, and preservation state machine
  disappear,
- BibTeX routing remains deterministic and idempotent,
- Harbor better matches its temporary triage boundary.

Tradeoffs:

- Harbor references no longer survive source link rot by themselves,
- exact historical page bodies are not retained,
- archival needs must be handled by a destination system outside Harbor.

## Supersedes

This decision supersedes ADR 0004 and ADR 0005. It amends ADR 0002 by removing
the active `preservation` group and amends ADR 0006 by routing resolved
references directly.
