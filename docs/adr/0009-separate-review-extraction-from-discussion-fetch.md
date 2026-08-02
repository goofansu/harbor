# ADR 0009: Separate review extraction from discussion fetch

- Status: Superseded by ADR 0012
- Date: 2026-08-02

## Context

Harbor needs enough source information to compare and route saved items, while
the agent harness already has native web retrieval for detailed conversation.
Using Firecrawl for both jobs obscures the product boundary and encourages
source-body persistence or repeated high-cost extraction.

Harbor is a temporary decision system, not a page reader or archive.

## Decision

Use Firecrawl only for structured JSON extraction during review. Requests must
define the metadata and analysis fields needed for triage and must not request
Markdown, HTML, raw HTML, screenshots, audio, or another source-body format.

When the user asks to discuss a saved source, use the agent harness's native web
fetch or browsing capability against the source URL. Treat the retrieved body
as ephemeral conversation evidence and do not persist it in Harbor.

Keep the Harbor record responsible for capture provenance, structured source
metadata, analysis, decisions, maintenance, and routing. Do not treat its
summary as authoritative source evidence when detailed discussion requires a
live fetch.

## Consequences

Benefits:

- Firecrawl has a narrow, predictable role in triage,
- discussion composes with capabilities already present in the agent harness,
- Harbor avoids becoming a content store or article reader,
- detailed conversations can use current source content without retaining it.

Tradeoffs:

- discussion depends on the source remaining fetchable,
- a live source may differ from the version originally reviewed,
- repeated discussions may incur native web-fetch latency,
- Harbor cannot reproduce unavailable historical wording.

## Amends

This decision narrows the active Firecrawl role left by ADR 0007 and makes
native agent web fetch the source-body retrieval path for discussion.
