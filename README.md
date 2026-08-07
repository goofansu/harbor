# Harbor

Harbor is an AI-native study triage system: a temporary place where saved
links arrive, get evaluated, and leave the inbox through one of two decisions.

```text
saved item -> triage -> study | discard
```

Harbor owns capture through decision. It is not a bookmark manager, knowledge
base, task manager, article reader, source archive, or teaching workspace.

| Decision  | Meaning                                      | Destination                         |
| --------- | -------------------------------------------- | ----------------------------------- |
| `study`   | Invest deliberate effort to understand it    | Study workspace and `reference.bib` |
| `discard` | It does not deserve further active attention | Resolved history                    |

`study` records an intention, not proof that the source was consumed,
understood, or retained. Guided lessons and learning records belong in a
separate study workspace.

## Repository

```text
harbor/
├── AGENTS.md
├── CONTEXT.md
├── README.md
├── reference.bib
├── docs/adr/
├── .agents/skills/triage/
├── inbox/
├── resolved/
│   ├── study/
│   └── discard/
└── sessions/
```

- `inbox/` contains unresolved items.
- `resolved/` contains items grouped by terminal decision.
- `reference.bib` contains generated entries for sources selected for study.
- `sessions/` contains concise batch-review records.
- `.agents/skills/triage/` defines the workflow and deterministic helpers.

## Using the MVP

Capture without interruption:

> Save this article: https://example.com/article

Review later:

> Review my Harbor inbox. Group overlapping items and ask as few questions as
> possible.

The agent writes the inbox record without retrieval. When structured source
metadata or analysis would materially improve triage, Firecrawl returns JSON;
Harbor does not request or retain the source body.

Resolve an item:

```text
npm run harbor:resolve -- --item inbox/item.md --decision study --reason "..."
npm run harbor:resolve -- --item inbox/item.md --decision discard --reason "..."
npm run harbor:bibtex -- --item resolved/study/item.md
```

An optional `--study-workspace <path>` records where a studied source was
routed. The guided-study skill is invoked from that external workspace, not
from Harbor.

Each item separates:

- `source`: page facts,
- `capture`: intake provenance,
- `fetch`: retrieval provenance,
- `analysis`: Harbor's derived judgments,
- `resolution`: recommendation and terminal decision,
- `outcomes`: later publications linked to the source,
- `routing.study`: the external study-workspace handoff,
- `routing.bibliography`: delivery to the citation database.

The BibTeX adapter atomically upserts a URL-only BibLaTeX `@online` entry and
leaves hand-written entries unchanged. Bibliography inclusion means the source
is available for citation; it does not claim learning occurred.

## Success signals

- resolution rate,
- items resolved per review session,
- average inbox age,
- confidence when discarding,
- regret after deletion,
- selected sources that become active study.
