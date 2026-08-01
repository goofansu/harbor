# ADR 0006: Route public-web references to BibTeX

- Status: Accepted
- Date: 2026-08-01

## Context

The user's Denote notes cite sources through `reference.bib`, and the downstream
LLM-maintained wiki should ingest only sources deliberately cited by a note.
Sending resolved references directly to the wiki would blur source availability
with user understanding.

All Harbor sources in the current workflow are public webpages, so the
bibliographic representation can use one fixed entry type. The bibliography is
also hand-maintained and must not be reformatted or replaced wholesale by an
adapter.

## Decision

Add a deterministic skill-internal BibTeX adapter that operates only on a
resolved `reference`.

The adapter emits a BibLaTeX `@online` entry with:

- optional `author`, when present in Harbor's `source.author`,
- `title`,
- optional publication `date`,
- `url`,
- `urldate`.

It omits `author` when Harbor has no source author, does not invent metadata, and
does not add Harbor-specific entry fields. A stable citation key is derived
from the Harbor item filename. Standard BibTeX comment lines delimit the
generated block and carry the Harbor item ID.

The adapter atomically appends a new managed block or replaces the existing
block for the same Harbor item. It does not parse, normalize, or rewrite
hand-maintained entries outside that block. Repeated export is idempotent.

The Harbor item records the destination, citation key, routing time, and status
under `routing.bibliography`. Bibliography export does not assert that the
source has been read, understood, or accepted. A citation from a user note is
the epistemic gate for downstream wiki ingestion.

## Consequences

Benefits:

- notes use ordinary citation keys instead of Harbor filesystem links,
- the `.bib` file remains standards-compatible,
- Harbor provenance remains traceable without custom bibliography fields,
- hand-maintained entries are preserved byte-for-byte,
- unread references cannot enter the wiki merely because Harbor retained them.

Tradeoffs:

- the bibliography and Harbor item are updated as separate atomic files, so a
  failed item update may require an idempotent retry,
- missing author metadata remains missing rather than being inferred,
- stable Harbor-derived citation keys are longer than conventional author-year
  keys,
- `@online` assumes a BibLaTeX-compatible bibliography consumer.

## Revisit when

Reconsider the fixed entry shape if Harbor accepts non-web sources, if the
bibliography toolchain requires classic BibTeX rather than BibLaTeX, or if a
dedicated reference manager replaces the `.bib` destination.
