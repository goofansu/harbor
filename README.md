# Harbor

Harbor is an AI-native read-later triage system: a temporary place where saved
links arrive, get evaluated, and move toward a decision.

The MVP is local and workflow-first. Codex or ChatGPT is the interface, Markdown
files are the source of truth, Firecrawl MCP may supply structured review data,
native agent web fetch supplies ephemeral discussion context, and small
skill-internal TypeScript scripts make capture and BibTeX routing deterministic.

## Lifecycle

```text
saved item
    |
    v
  triage
    |
    v
 decision
    |
    +-- read
    +-- reference
    +-- action
    `-- discarded
```

Harbor owns capture through decision. It is not a bookmark manager, knowledge
base, task manager, article reader, or source archive.

## Repository

```text
harbor/
├── AGENTS.md
├── CONTEXT.md
├── README.md
├── package.json
├── docs/adr/
├── .agents/skills/triage/
├── inbox/
├── resolved/
│   ├── read/
│   ├── reference/
│   ├── action/
│   └── discarded/
└── sessions/
```

- `inbox/` contains unresolved items.
- `resolved/` contains items grouped by terminal decision.
- `sessions/` contains concise batch-review records.
- `.agents/skills/triage/` defines the agent workflow and deterministic helpers.

Historical files under `exports/reference/` predate the removal of snapshot
preservation. Harbor no longer creates or consumes them.

## Using the MVP

Ask the agent to capture without interruption:

> Save this article: https://example.com/article

Later, ask for a decision-focused review:

> Review my Harbor inbox. Group overlapping items and ask as few questions as
> possible.

The agent writes the inbox record without retrieval. During review, Firecrawl
may return structured JSON metadata and analysis inputs. Harbor retains source
metadata, analysis, and decisions, but not the fetched page body.

When discussing a saved source, the agent uses its native web fetch or browser
against the URL on demand. That source body remains ephemeral and is not written
into Harbor.

Each item separates:

- `source`: page facts such as URL, title, author, and publication date,
- `capture`: intake provenance,
- `fetch`: retrieval provenance,
- `analysis`: Harbor's derived judgments,
- `resolution`: recommendation and terminal decision,
- `maintenance`: selective reconsideration policy,
- `routing.bibliography`: delivery to a citation database.

## Reads, references, and BibTeX

A resolved read or reference is represented by its Harbor record. Harbor does
not create a second Markdown snapshot.

The BibTeX adapter can atomically upsert a fixed BibLaTeX `@online` entry:

```text
npm run harbor:capture -- --url https://example.com/article
npm run harbor:bibtex -- --item resolved/read/item.md --bibliography ../notes/reference.bib
npm run harbor:bibtex -- --item resolved/reference/item.md --bibliography ../notes/reference.bib
```

Generated entries contain the optional source author, title, optional
publication date, URL, and access date. The adapter replaces only its managed
block and leaves hand-written bibliography entries unchanged.

Adding a source to the bibliography means it is available for citation; it
does not mean a selected read was consumed or that the source was understood. A
citation from a user note is the deliberate signal that downstream systems such
as an LLM-maintained wiki may ingest it.

## Reference maintenance

Harbor does not continuously re-fetch resolved items. References default to
reconsideration when related evidence appears, the source becomes unavailable
or superseded, an explicit review date arrives, or the user requests an audit.
Re-run the BibTeX adapter when retained source metadata changes.

## Success signals

- resolution rate,
- items resolved per review session,
- average inbox age,
- confidence when discarding,
- regret after deletion.

The MVP succeeds when saved items stop accumulating and useful conclusions are
retained before sources leave active attention.
