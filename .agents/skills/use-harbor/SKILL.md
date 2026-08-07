---
name: use-harbor
description: Operate a local Harbor inbox by capturing, reviewing, resolving, and routing links. Use when saving a link, reviewing or prioritizing saved items, grouping duplicates, or deciding whether a source deserves structured study or should be discarded. Check the Harbor environment first and ask the user to invoke setup-harbor when it is missing or invalid.
---

# Use Harbor

Treat Harbor as a temporary decision queue:

```text
saved item -> triage -> study | discard
```

Harbor is not a reader, bookmark manager, knowledge base, or teaching
workspace. Operate on `inbox/`, `resolved/`, and `sessions/`. Read
`CONTEXT.md` before changing workflow or storage boundaries.

## Environment Preflight

Before every capture, review, or resolution operation:

1. Read `docs/agents/harbor.md` and interpret the study-root convention stated
   in its prose. Do not require frontmatter and do not ask a script to parse
   the Markdown.
2. Resolve `~` and other user-relative notation to an absolute path, then run
   `npm run harbor:setup:check -- --study-root <absolute-path>`.
3. If it succeeds, retain that absolute path and pass it explicitly as
   `--study-root` to any resolver invocation.
4. If the document is missing, its location is ambiguous, or the check fails,
   do not capture, review, resolve, or route anything. Tell the
   user that Harbor's study environment is not ready and ask them to invoke
   `$setup-harbor`.
5. Do not infer a workspace path from `.env`, improvise one, or invoke
   `$setup-harbor` without the user's agreement. `.env` is reserved for secrets
   and other process configuration.

This setup question is the only allowed interruption before capture. Once the
environment is valid, capture remains question-free.

## Capture

When the user asks to save a URL:

1. After the environment preflight succeeds, do not ask item-specific
   follow-up questions.
2. Run:
   `npm run harbor:capture -- --url <url> [--title <title>] [--notes <notes>]`
3. Pass arguments as separate shell values.
4. Do not retrieve the source during capture.
5. Leave unknown analytical fields empty.
6. Confirm briefly.

New records use grouped frontmatter:

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
routing:
  study:
    status: "not_applicable"
    destinations: []
    routed_at:
    failure_reason:
```

Keep page facts in `source`, intake provenance in `capture`, retrieval
provenance in `fetch`, judgments in `analysis`, decisions in `resolution`, and
delivery state in `routing`.

## Review

1. Read all relevant inbox records before asking questions.
2. Compare them as a set and against existing study items.
3. Group duplicates, strong overlaps, and sources serving the same learning
   goal.
4. Use Firecrawl only when page metadata or structured JSON would materially
   improve the decision:
   `npm run harbor:review -- --item inbox/<item>.md`
5. Do not request or retain Markdown, PDFs, or another source body. Do not place
   source bodies in agent context.
6. Estimate novelty relative to Harbor's corpus:
   - `high`: materially new concepts, evidence, or framing;
   - `medium`: familiar subject with useful additions;
   - `low`: substantially duplicated or superseded;
   - `unknown`: insufficient comparison evidence.
7. Keep freshness separate from novelty.
8. Recommend exactly `study` or `discard`.
9. Ask one grouped, high-value question when user judgment is required.

Prefer: "These three sources cover the same topic. Study the clearest one and
discard the other two?"

## Resolve

Use exactly one terminal state:

- `study`: invest deliberate effort to understand the topic or acquire a skill;
- `discard`: the source deserves no further active attention.

For every item:

1. Set the decision, deciding actor, concrete reason, and resolution time.
2. Preserve useful structured analysis before discarding.
3. Run:
   `npm run harbor:resolve -- --item inbox/<item>.md --decision <study-or-discard> --reason <reason> --study-root <absolute-path> [--study-workspace <path-or-topic>]...`
4. For `study`, repeat `--study-workspace` for every topic the source should
   serve. An absolute value is used directly. A relative topic name resolves
   beneath the explicitly supplied `--study-root`, documented by
   `$setup-harbor`. The resolver deduplicates the destinations, records them in
   `routing.study.destinations`, and abbreviates paths beneath the user's home
   directory with `~`.
5. For `discard`, perform no downstream routing.

`study` records an intention, not proof of reading or understanding. Invoke the
guided-study skill later from the external study workspace. Harbor does not
create lessons, learning records, or raw source copies.

## Review Sessions

For a substantive batch review, update `sessions/YYYY-MM-DD.md` with groups,
questions, decisions, unresolved uncertainty, and the number resolved.

## Guardrails

- Do not create additional terminal states.
- Do not turn Harbor into permanent storage or a teaching workspace.
- Do not fetch or retain source bodies.
- Do not create `saves/` or another saved-article store.
- Do not invent source facts or saving intent.
- Do not treat freshness as novelty.
- Do not silently remove a resolved item or its concrete reason.
