# ADR 0003: Selective, event-driven reference maintenance

- Status: Accepted
- Date: 2026-08-01

## Context

A resolution is historically true at the moment it is made, but the evidence
supporting it can age. A retained reference may later become duplicated,
superseded, unavailable, or irrelevant.

Continuously re-fetching and re-evaluating every resolved item would create
cost, unstable decisions, and pressure for Harbor to become a permanent
bookmark-maintenance system.

## Decision

Treat terminal decisions as historical events that never change silently.
Maintain references selectively and only when new evidence could change a
decision.

Use these maintenance policies:

- `none`: no automatic reconsideration,
- `on_related_item`: reconsider when a newly reviewed item substantially
  overlaps,
- `time_based`: reconsider after an explicit `review_after` during a requested
  review or audit,
- `manual`: reconsider only when the user asks.

References default to `on_related_item`. Other terminal states default to
`none`.

Use these maintenance states:

- `current`,
- `review_due`,
- `superseded`,
- `unavailable`.

Do not add a background scheduler during the MVP. A maintenance trigger creates
a new recommendation. Changing the terminal decision still requires user
approval or explicit standing authority, and the prior resolution must be
preserved in the session history.

Long-term reference-library upkeep belongs to the destination reference system,
not Harbor.

## Consequences

Benefits:

- maintenance effort is proportional to decision value,
- historical decisions remain auditable,
- new items can expose duplication without full-library rescans,
- Harbor preserves its temporary triage boundary,
- the MVP requires no scheduler or monitoring infrastructure.

Tradeoffs:

- stale references may remain undetected until a trigger occurs,
- related-item detection must consider retained references,
- session logs carry decision-history responsibility,
- time-based policies are advisory until a review or audit runs.

## Revisit when

Reconsider background maintenance only if user research shows that undetected
staleness causes meaningful regret and event-driven review is insufficient.
