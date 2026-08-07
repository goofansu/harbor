# Harbor Product Context

## Vision

Harbor is an AI-native study triage system.

Saving links is easy. The unresolved problem is deciding whether a saved source
deserves deliberate learning effort. Harbor turns an accumulating inbox into a
binary, motivated decision:

> Study this, or confidently let it go.

Harbor is temporary. It is not a permanent bookmark system, article reader,
knowledge base, or teaching workspace.

## Product boundary

Harbor owns:

```text
saved item -> triage -> study | discard
```

After resolution:

- `study`: the source is worth deliberate effort and Harbor may record an
  external study-workspace destination;
- `discard`: the source leaves active attention after Harbor preserves a
  concrete reason and any useful analysis.

`study` describes an intention and route. It does not assert that the user
read, understood, retained, or accepted the source. Teaching artifacts,
practice, and evidence of learning belong to the external study workspace.

## MVP

The MVP is local-only and agent-driven:

- ChatGPT or Codex is the interface;
- Markdown files are the source of truth;
- the repository triage skill defines the workflow;
- skill-internal TypeScript scripts perform deterministic file operations;
- Firecrawl may provide structured metadata and analysis JSON during review.

The repo-local `$setup-harbor` skill records the study-root convention as prose
in `docs/agents/harbor.md`. The triage agent interprets that guidance, resolves
it to an absolute path, and passes it explicitly to deterministic scripts.
Relative study-workspace names resolve beneath that root; absolute workspace
paths remain valid overrides. Scripts do not parse the Markdown configuration.

Do not build a web UI, authentication, database, user-facing CLI, application
service, or custom MCP server during workflow validation.

## Core workflow

### Capture

Triage first validates the study environment. When it is missing or invalid,
the workflow pauses and asks the user to invoke `$setup-harbor`. After that
preflight succeeds, capture is retrieval-free and asks no item-specific
questions.

### Review

Review compares items as a collection, groups duplicates and overlaps,
estimates novelty relative to Harbor's corpus, and asks only questions that
unlock meaningful study-or-discard decisions.

When retrieval materially improves triage, request page metadata and
schema-defined JSON only. Harbor does not request, stage, retain, or place raw
source bodies in agent context.

### Resolve

Every item reaches exactly one terminal state:

- `study`: worth active, structured learning;
- `discard`: not worth further attention.

Every decision preserves a specific reason. A study destination may be recorded
in `routing.study`; actual workspace creation, resource curation, and teaching
happen outside Harbor.

### Record outcomes

Later publications are append-only outcomes. They do not change the historical
terminal decision and do not make Harbor a publishing system.

## Item model

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
outcomes:
  items:
routing:
  study:
    status:
    destination:
    routed_at:
    failure_reason:
```

The groups preserve provenance:

- `source` contains page facts;
- `capture` records intake;
- `fetch` records structured retrieval;
- `analysis` contains Harbor's judgments;
- `resolution` records recommendation, decision, actor, reason, and time;
- `outcomes.items` records append-only publications;
- `routing.study` records the external learning-workspace handoff.

Novelty is relative to Harbor's corpus, not a claim of global originality.
Use `high`, `medium`, `low`, or `unknown`; freshness remains separate.

## Learning resources

Harbor preserves the selected source URL and structured analysis. Each study
workspace curates the sources actually used for learning in its own
`RESOURCES.md`; Harbor does not maintain a bibliography or citation keys.

## Legacy data

The former workflow used `read`, `reference`, `action`, and `discarded`.
Historical read and reference items migrate to `study`; discarded items migrate
to `discard`. No action items existed at migration time. The former `saves/`
article store has been removed.

## Product principles

1. Capture first; clarify later.
2. Compare collections, not isolated links.
3. Ask questions that settle groups of decisions.
4. Preserve reasoning, especially for deletion.
5. Select sources for deliberate learning, not passive consumption.
6. Keep teaching and evidence of learning outside Harbor.
7. Keep source facts distinct from generated analysis and decisions.
