# ADR 0013: Record post-resolution outcomes

- Status: Superseded by ADR 0021
- Date: 2026-08-03

## Context

Harbor assigns each source exactly one terminal decision: `read`, `reference`,
`action`, or `discarded`. A source selected and consumed as `read` may later
inspire a published blog post.

Reclassifying that source as `action` would erase the historical reading
decision and conflict with the saved article and bibliography routing attached
to `read`. Ignoring the later result leaves Harbor unable to explain what value
the source produced.

Harbor remains a temporary decision system, not a publishing platform.

## Decision

Add an append-only `outcomes.items` collection to every Harbor item. New items
start with an empty collection.

An outcome records:

- `kind`: always `publication`,
- published `title`,
- public HTTP or HTTPS `url`,
- `recorded_at`.

The deterministic outcome helper appends entries only to terminally resolved
items. It never changes `resolution.decision`, removes earlier outcomes, manages
external work, or records an outcome without a user-confirmed public URL. Harbor
does not record planned or merely routed work.

Legacy resolved items acquire the group when their first outcome is recorded.
Existing active records are migrated to the empty group with this decision.

## Consequences

- A `read` source can retain links to later publications without losing its
  reading history.
- One source can produce multiple publications.
- Harbor records published value without owning downstream execution.
- Correcting an erroneous outcome requires appending a compensating record; the
  MVP does not provide mutation or deletion operations.
- Outcome entries reflect confirmed publication facts at recording time; Harbor
  does not monitor the URL afterward.
