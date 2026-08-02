---
name: triage
description: Capture, review, discuss, resolve, route, and selectively maintain links in a local Harbor inbox using provenance-aware markdown files, structured Firecrawl review data, and native agent web fetch for on-demand source discussion. Use when a user asks to save a link for later, inspect or review saved items, discuss a saved source, group duplicates or related items, prioritize an inbox, migrate a legacy Harbor item, audit retained references, or route items to read, reference, action, or discarded states while preserving the reason.
---

# Harbor Triage Workflow

Treat Harbor as a temporary decision queue, not a bookmark manager, reader, or
knowledge base. Move every reviewed item toward a decision while minimizing
interruptions and maximizing decisions per user question.

Operate on Harbor records in `inbox/`, `resolved/`, and `sessions/`, disposable
review staging in `.cache/firecrawl/`, and selected reading output in `saves/`.
Read `CONTEXT.md` before changing the workflow or its boundaries.

## Capture

When the user asks to save a URL:

1. Do not ask follow-up questions.
2. From the repository root, immediately invoke the deterministic internal
   script:
   `npm run harbor:capture -- --url <url> [--title <title>] [--notes <notes>]`.
   Pass arguments as separate shell values and never interpolate untrusted text
   into a shell command string.
3. The script creates one markdown file in `inbox/` using
   `YYYYMMDDHHMMSS-short-title.md`, using a URL-derived slug if the title is
   unknown. It writes atomically and never overwrites a collision.
4. The script records the URL, capture time, capture actor, and source title
   when supplied. It performs no retrieval.
5. Do not call Firecrawl during capture. Use it later during review only when
   structured data would materially improve triage.
6. Leave unknown analytical fields empty. Do not invent saving intent.
7. Confirm briefly that the item was saved.

Use this frontmatter shape:

```yaml
---
source:
  url: "https://example.com/article"
  title:
  author:
  published_at:
capture:
  saved_at: "2026-08-01T10:00:00+08:00"
  saved_by: "user"
fetch:
  provider:
  fetched_at:
  formats: []
analysis:
  display_title:
  summary:
  concepts: []
  estimated_read_time:
  novelty:
  novelty_reason:
  related_items: []
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
    status: "not_applicable"
    destination:
    staged_at:
    saved_at:
    failure_reason:
  bibliography:
    status: "not_applicable"
    destination:
    citation_key:
    routed_at:
    failure_reason:
---
```

Add brief freeform notes below the frontmatter only when the user supplied
context that should be preserved verbatim or nearly verbatim.

Keep source evidence, Harbor analysis, and decisions separate:

- Put facts represented by the page in `source`.
- Put the capture event in `capture`.
- Put retrieval metadata in `fetch`.
- Put derived or contextual judgments in `analysis`.
- Put recommendations and terminal choices in `resolution`.
- Put selective post-resolution review policy and state in `maintenance`.
- Put staged or saved reading-artifact delivery in `routing.article`.
- Put delivery to an external bibliography in `routing.bibliography`.

## Review

When the user asks to review the inbox:

1. Read all relevant inbox items before asking questions.
2. Migrate legacy flat frontmatter to the grouped schema during review. Preserve
   existing timestamps, decisions, and reasons.
3. When Firecrawl would materially improve a decision, invoke
   `npm run harbor:review -- --item inbox/<item>.md`. The deterministic helper
   makes one SDK scrape request for page metadata, schema-defined analysis JSON,
   and cleaned main-content Markdown. It returns only the analysis JSON to the
   agent and stages Markdown under gitignored `.cache/firecrawl/`.
4. Populate exact source title, author, and publication date from Firecrawl
   page metadata when available. Preserve existing values when metadata omits a
   field; never replace source facts with generative JSON guesses. Record the
   provider, retrieval time, and requested formats in `fetch`.
5. Populate `analysis` summary, concepts, and estimated read time from
   Firecrawl's schema-defined JSON. Add Harbor's contextual novelty, novelty
   reason, related items, recommendation, and analysis time separately.
6. Compare items as a set and against relevant retained references. Group
   duplicates, strong overlaps, and items serving the same likely goal.
7. Estimate novelty relative to Harbor's corpus at review time:
   - `high`: materially new concepts, evidence, framing, or consequences,
   - `medium`: a familiar subject with useful additions or updates,
   - `low`: substantially duplicates or is superseded by an existing item,
   - `unknown`: insufficient comparable material or analysis.
8. Keep freshness separate from novelty. Explain the comparison basis in
   `analysis.novelty_reason`.
9. Flag stale, unavailable, or superseded sources.
10. Set `resolution.recommendation` for each item or group.
11. Resolve obvious low-risk groups directly when the user's standing
    instructions permit it. Otherwise ask one high-value question that can
    settle several items at once.

Prefer questions such as:

- "These four articles repeat the same MCP architecture pattern. Keep the
  clearest one as reference and discard the other three?"
- "These three items imply one project action. Convert the group into one
  action and discard the source links after preserving the summary?"

Avoid asking the user to classify items one at a time when a grouped decision
is possible.

## Discuss

When the user asks to discuss a saved source:

1. Locate the source URL and Harbor analysis from the item record.
2. Use the agent harness's native web fetch or browsing capability to retrieve
   the source on demand. Do not use Firecrawl for discussion retrieval.
3. Treat the live source as evidence and the Harbor summary as orientation, not
   as a substitute for the source when details matter.
4. Keep the fetched body ephemeral. Do not write it into Harbor or another
   persistence layer.
5. Preserve only conclusions the user explicitly asks to route into notes or
   another destination.

## Resolve

Use exactly one terminal state:

- `read`: selected for consumption or recorded as consumed
- `reference`: worth retaining in the user's reference system
- `action`: converted into a concrete task or project input
- `discarded`: no longer deserves active attention

For each resolved item:

1. Set `resolution.decision`, `resolution.decided_by`,
   `resolution.reason`, and `resolution.resolved_at`.
2. Make the reason concrete enough to support deletion confidence. Mention the
   better source, duplicate, outdated claim, extracted insight, or resulting
   action when relevant.
3. Set `decided_by` to `user` for an explicit user choice or `agent` only when
   standing instructions authorize autonomous resolution.
4. Preserve any useful summary or concepts before discarding the original link.
5. Set maintenance:
   - for `reference`, default to `policy: on_related_item`, `state: current`,
     and set `last_reviewed_at`,
   - for other decisions, set `policy: none` and leave scheduling fields empty,
   - set `review_after` only when the user identifies time-sensitive material.
6. Invoke
   `npm run harbor:resolve -- --item inbox/<item>.md --decision <decision> --reason <reason>`.
   The deterministic resolver moves the item to `resolved/<decision>/`.
7. For `read`, require staged Markdown and promote it atomically to
   `saves/<citation-key>.md`. For every other decision, delete staged Markdown.
8. For `read` and `reference`, the resolver invokes the bibliography adapter.
   Read entries include a local `file`; references remain URL-only.
9. Record any other external destination or resulting action in the item's
   body when applicable. Do not fabricate a completed transfer to another
   system.

## Save Selected Reads

Only `read` creates a durable article body. Saved Markdown is a mechanical
source attachment, not a Harbor item record or user-authored note.

- Use one current file at `saves/<citation-key>.md`.
- Do not create immutable versions, hashes, or scheduled refreshes.
- Do not expose the article body to agent context during review or routing.
- Keep the original URL in BibTeX as provenance and fallback.
- Treat `.cache/firecrawl/` as disposable staging and `saves/` as durable
  reading output.
- Leave `reference` as a metadata-only bookmark.

## Route Reads and References to BibTeX

Use BibTeX as the reference-system adapter for public-web items resolved as
`read` or `reference`. The bibliography entry makes a source available for
citation. It does not claim that a selected `read` item was consumed,
understood, or accepted. A citation from a user note remains the deliberate
promotion signal for downstream knowledge ingestion.

After resolving an item as `read` or `reference`, invoke:

`npm run harbor:bibtex -- --item resolved/<read-or-reference>/<item>.md`

The adapter writes to the repository-local `reference.bib` by default. The
user configures `org-cite-global-bibliography` to include that file. An
explicit `--bibliography <path>` may override the destination when needed.

The adapter:

1. accepts only an item resolved as `read` or `reference`;
2. emits one BibLaTeX-standard `@online` entry for the public URL;
3. uses the fixed fields optional `author`, `title`, optional publication
   `date`, `url`, optional `file` for reads, and `urldate`;
4. emits `author` only when Harbor's `source.author` is non-empty and never
   invents unavailable source metadata;
5. derives a stable citation key from the Harbor item filename;
6. surrounds the generated entry with BibTeX comments containing the Harbor
   item ID;
7. atomically appends or replaces only that managed block, leaving hand-written
   bibliography entries unchanged;
8. records the bibliography destination, citation key, routing time, and
   outcome in `routing.bibliography`.

Re-running the adapter is idempotent. It updates the existing managed block when
source metadata changes and does not duplicate the entry.

## Maintain References

Pay maintenance cost only when new evidence could change a decision. Do not
scan or re-fetch all resolved items by default.

Support these policies:

- `none`: do not reconsider automatically,
- `on_related_item`: reconsider when a newly reviewed item substantially
  overlaps the reference,
- `time_based`: reconsider after `review_after` during a requested review or
  audit,
- `manual`: reconsider only when the user asks.

Support these states:

- `current`: no maintenance concern is known,
- `review_due`: a trigger requires reconsideration,
- `superseded`: a better replacement is known,
- `unavailable`: the source cannot be retrieved.

When maintaining references:

1. Trigger review from a related new item, explicit audit, discovered
   unavailability, or an applicable `review_after`.
2. Refresh source evidence and analysis only when needed.
3. Update `maintenance.state` and `last_reviewed_at`.
4. Produce a new recommendation without silently changing the terminal
   decision.
5. Before changing a decision, record the prior resolution in the session log.
6. Apply a new terminal decision only with user approval or standing authority.
7. Re-run the BibTeX adapter when source metadata changes.
8. Route long-term upkeep to the destination reference system when one exists.

## Review Sessions

For a substantive batch review, create or update
`sessions/YYYY-MM-DD.md`. Summarize:

- the groups reviewed,
- the questions asked,
- the decisions made,
- unresolved uncertainty,
- the number of items resolved.

Keep the session log concise. The item files remain the source of truth for
individual decisions.

## Guardrails

- Do not turn Harbor into permanent storage.
- Do not build application code, a UI, CLI, database, authentication, or a
  custom MCP server unless the user explicitly changes the MVP scope.
- Do not require full-page extraction before capture.
- Do not retain fetched full-page content for decisions other than `read`.
- During Firecrawl-assisted review, use page metadata for source facts,
  schema-defined JSON for analysis inputs, and Markdown only for direct-to-disk
  staging; never place Markdown in agent context.
- Do not use Firecrawl to retrieve source bodies for discussion.
- Do not treat bibliography export as evidence that the user consumed,
  understood, or accepted a source.
- Do not place generated summaries, novelty judgments, or recommendations in
  `source`.
- Do not treat recency alone as novelty.
- Do not run broad scheduled maintenance or turn `resolved/reference/` into a
  managed bookmark library.
- Do not silently change a historical terminal decision during maintenance.
- Do not delete a saved item without preserving its terminal decision and
  reason in `resolved/`.
- Do not confuse content retrieval with triage judgment.
