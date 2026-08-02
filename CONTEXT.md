# Harbor Product Context

## Vision

Harbor is an AI-native read-later triage system.

Saving links is already easy. The unsolved problem is that saved links
accumulate because saving intent is unclear, fear of missing out prevents
deletion, and read-later tools blur into permanent bookmarking systems.
Information is kept without being converted into decisions or knowledge.

Harbor should help users decide what deserves attention:

> A temporary harbor where information arrives, gets evaluated, and is routed
> somewhere else.

It is not a permanent storage system.

## Product boundary

Harbor owns:

```text
saved item -> triage -> decision
```

After resolution:

- `read`: the user selects it for consumption, cleaned Markdown is saved under
  `saves/`, and its source metadata is routed to the reference system,
- `reference`: its source metadata is retained and may be routed to a reference
  system,
- `action`: it becomes a task or project input,
- `discarded`: it leaves active attention.

Harbor must not become another bookmark manager, personal knowledge management
system, or article reader.

## MVP

The MVP is local-only and agent-driven.

Use:

- an interactive ChatGPT or Codex agent as the interface,
- the repository's triage skill as workflow guidance,
- markdown files as storage,
- skill-internal TypeScript scripts for deterministic file operations,
- the official Firecrawl SDK in a deterministic helper for combined structured
  review data and direct-to-disk Markdown staging,
- the agent harness's native web fetch for on-demand source discussion.

Do not build a web UI, authentication, database, CLI, application service, or
custom MCP server during workflow validation.

The TypeScript scripts are agent implementation helpers, not a user-facing CLI
or application surface.

## Core workflow

### Capture

Capture must be frictionless. When a user saves a URL, store it with minimal
metadata and do not immediately ask why it matters. Fetching page content is
optional and must not delay capture.

### Review

Review is where intelligence belongs. Analyze items as a collection, group
duplicates and overlaps, estimate value and freshness, and ask only questions
that unlock meaningful decisions.

Optimize for decisions per question, not items processed.

When Firecrawl materially improves review, one SDK request returns page
metadata for source facts, schema-defined JSON analysis inputs, and cleaned
Markdown. The helper returns only analysis JSON to the agent and stages
Markdown in a disposable gitignored cache.

### Discuss

When the user wants to discuss a source, the agent harness fetches the source
URL on demand through its native web or browsing capability. The fetched body
is ephemeral conversation evidence: Harbor does not store it, route it, or
treat its earlier summary as a substitute when source details matter.

### Resolve

Every item eventually reaches one terminal state: `read`, `reference`,
`action`, or `discarded`.

Preserve a specific reason with every decision. The reason is part of the
product: it gives the user confidence that discarding an item will not erase
something important.

Resolving an item as `read` promotes staged Markdown to one current file under
`saves/` and routes source metadata plus that attachment path to BibTeX.
Resolving an item as `reference` routes metadata only. Other decisions discard
staged Markdown.

### Maintain

Maintenance is selective and event-driven. Pay its cost only when new evidence
could change a decision.

The `discarded`, `read`, and `action` states require no ongoing Harbor
maintenance. A retained reference may be reconsidered when a new overlapping
item arrives, a better source supersedes it, its URL is found unavailable, the
user requests an audit, or the user explicitly marks it as time-sensitive.

Harbor does not silently change decisions and does not perform broad background
re-fetches. Long-term library upkeep belongs to the destination reference
system.

## Item model

Each item is a markdown document with YAML frontmatter. The frontmatter
separates page evidence, Harbor analysis, and the final decision:

```yaml
source:
  url:
  title:
  author:
  published_at:
capture:
  saved_at:
  saved_by:
fetch:
  provider:
  fetched_at:
  formats:
analysis:
  display_title:
  summary:
  concepts:
  estimated_read_time:
  novelty:
  novelty_reason:
  related_items:
  analyzed_at:
resolution:
  recommendation:
  decision:
  decided_by:
  reason:
  resolved_at:
maintenance:
  policy:
  state:
  last_reviewed_at:
  review_after:
routing:
  article:
    status:
    destination:
    staged_at:
    saved_at:
    failure_reason:
  bibliography:
    status:
    destination:
    citation_key:
    routed_at:
    failure_reason:
```

The groups communicate provenance:

- `source` contains facts represented by the page.
- `capture` records how the item entered Harbor.
- `fetch` records retrieval provider, time, and requested formats.
- `analysis` contains Harbor's derived and contextual judgments.
- `resolution` distinguishes Harbor's recommendation from the terminal choice
  and records who made that choice.
- `maintenance` records whether and why a resolved reference should be
  reconsidered.
- `routing.article` records temporary staging and durable save delivery for a
  selected read.
- `routing.bibliography` records whether a public-web item resolved as `read`
  or `reference` was delivered to a citation database.

The deterministic Firecrawl helper owns `URL -> page metadata + structured
analysis JSON + direct-to-disk staged Markdown`. The agent harness's native web fetch owns
`URL -> ephemeral discussion context`. Harbor owns structured review data ->
decision and promotes staged Markdown only for `read`.

Novelty is relative to Harbor's corpus at analysis time, not a claim of global
originality. Use `high`, `medium`, `low`, or `unknown`; use `unknown` when the
corpus or evidence is too sparse for a meaningful comparison. Freshness is a
separate property.

Reference maintenance policies are `none`, `on_related_item`, `time_based`, and
`manual`. References default to `on_related_item`. Maintenance states are
`current`, `review_due`, `superseded`, and `unavailable`. Time-based policy does
not imply a background scheduler in the MVP; it is evaluated during a requested
review or audit.

Capture is a deterministic local write and never waits for Firecrawl. Review
may call the Firecrawl SDK once for page metadata, JSON, and Markdown. Harbor
uses page metadata for source facts, schema-defined JSON for analysis inputs,
and never lets inferred JSON overwrite explicit source metadata. Markdown
bypasses agent context and remains disposable unless the decision is `read`.
Native agent web fetch provides live source context for discussion without
persistence. A shared filesystem-backed limiter allows at most two concurrent
Firecrawl requests across review processes so free-tier concurrency is not
exceeded.

The BibTeX adapter routes an item resolved as `read` or `reference` to the
repository-local `reference.bib` by default. It emits a fixed BibLaTeX `@online`
record containing the optional Harbor source author, source title, optional
publication date, public URL, optional local `file` for reads, and access date.
References remain URL-only. It omits `author` when `source.author` is empty.
Bibliography availability does not imply that a selected item was consumed or
understood; a citation from a user-authored note is the downstream promotion
signal.

## Architecture direction

The initial architecture is:

```text
ChatGPT/Codex project
        |
   Harbor skill
     /       \
    /         \
internal     native web fetch
scripts      (ephemeral discussion)
  /   \
Markdown Firecrawl SDK
           |
      JSON + staged Markdown
```

If the workflow proves valuable, the long-term direction is:

```text
User agent
    |
    | MCP
    v
Harbor service
    |
Domain logic
    |
Firecrawl API
```

The eventual product may be an AI-native API or MCP service. That is a later
architecture, not MVP scope.

## Product principles

1. Capture first; clarify later.
2. Compare collections, not isolated links.
3. Ask questions that settle groups of decisions.
4. Preserve reasoning, especially for deletion.
5. Extract durable value before discarding a source.
6. Route resolved information out of Harbor.
7. Keep source evidence distinct from generated analysis.
8. Keep source availability distinct from user understanding.
9. Reconsider references only when new evidence could change a decision.
10. Preserve decision history rather than silently rewriting it.
11. Use native agent retrieval for discussion and deterministic direct-to-disk
    retrieval for selected reading.
12. Validate behavior before building infrastructure.

## Success criteria

The MVP succeeds if:

1. saved items stop accumulating,
2. the user feels comfortable deleting links,
3. reviews require few questions,
4. the agent understands or reconstructs why items matter,
5. useful knowledge survives even when source links are discarded.

Track resolution rate, items resolved per review session, average inbox age,
discard confidence, regret after deletion, and reference-routing completion
rate.
