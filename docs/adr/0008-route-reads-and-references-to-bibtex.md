# ADR 0008: Route reads and references to BibTeX

- Status: Accepted
- Date: 2026-08-01

## Context

Harbor previously routed only `reference` decisions to the user's
`reference.bib`. A `read` decision also preserves a public source for future
attention or records its consumption, so omitting it from the bibliography
made the source unavailable to the user's normal citation workflow.

Bibliography presence represents source availability, not proof that the user
consumed, understood, or accepted the source.

## Decision

Route public-web items resolved as either `read` or `reference` through the
deterministic BibTeX adapter.

The adapter accepts Markdown items directly from `resolved/read/` and
`resolved/reference/`. It continues to reject `action` and `discarded` items,
uses the fixed BibLaTeX `@online` shape, updates only its managed block, and
records the routing outcome in the Harbor item.

Keep maintenance behavior decision-specific: references default to
`on_related_item`, while reads retain `policy: none`. Bibliography routing does
not turn a read into a maintained reference.

## Consequences

Benefits:

- selected reading is available in the user's citation workflow,
- read and reference decisions share one deterministic routing path,
- citation remains the deliberate promotion signal for downstream knowledge
  ingestion.

Tradeoffs:

- the bibliography contains sources selected for reading as well as durable
  references,
- bibliography presence alone cannot distinguish selected, consumed, or
  understood material; Harbor's resolution record preserves that distinction.

## Amends

This decision amends ADR 0006 and ADR 0007 by broadening BibTeX eligibility
from `reference` to `read` or `reference`.
