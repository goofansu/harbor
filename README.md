# Harbor

Harbor is an AI-native read-later triage system: a temporary place where saved
links arrive, get evaluated, and move toward a decision.

The MVP is local and workflow-first. Codex or ChatGPT is the interface, Markdown
files are the source of truth, the Firecrawl SDK supplies combined structured
review data and direct-to-disk Markdown staging, and small skill-internal
TypeScript scripts make capture and routing deterministic.

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

| Decision    | What remains to do       | Destination                 |
| ----------- | ------------------------ | --------------------------- |
| `read`      | Consume the source       | `saves/` and BibTeX         |
| `reference` | Keep it available        | Reference system and BibTeX |
| `action`    | Perform the derived work | Task or project system      |
| `discarded` | Nothing                  | Resolved history            |

A `read` decision means the source itself deserves attention. An `action`
decision means the source has already been translated into concrete work beyond
consuming it. Reading may later produce a separate action linked back to the
source.

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
├── saves/
├── resolved/
│   ├── read/
│   ├── reference/
│   ├── action/
│   └── discarded/
└── sessions/
```

- `inbox/` contains unresolved items.
- `saves/` contains one current Markdown reading file per selected read.
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

The agent writes the inbox record without retrieval. During Firecrawl-assisted
review, one SDK request returns structured JSON plus Markdown. Only JSON enters
agent context; Markdown is staged in a gitignored cache until the decision.

Each item separates:

- `source`: page facts such as URL, title, author, and publication date,
- `capture`: intake provenance,
- `fetch`: retrieval provenance,
- `analysis`: Harbor's derived judgments,
- `resolution`: recommendation and terminal decision,
- `maintenance`: selective reconsideration policy,
- `routing.article`: staged or saved reading-artifact delivery,
- `routing.bibliography`: delivery to a citation database.

## Reads, references, and BibTeX

A resolved reference remains a URL-only bookmark. A resolved read promotes
staged Markdown into one current `saves/<citation-key>.md` reading file.

The BibTeX adapter can atomically upsert a fixed BibLaTeX `@online` entry:

```text
npm run harbor:capture -- --url https://example.com/article
npm run harbor:review -- --item inbox/item.md
npm run harbor:resolve -- --item inbox/item.md --decision read --reason "..."
npm run harbor:bibtex -- --item resolved/read/item.md
npm run harbor:bibtex -- --item resolved/reference/item.md
```

Generated entries contain the optional source author, title, optional
publication date, URL, optional local `file` for reads, and access date. The
adapter replaces only its managed block and leaves hand-written bibliography
entries unchanged. It writes to the repository-local `reference.bib` by
default; `--bibliography <path>` can override that destination.

The review helper returns only structured JSON to the agent. The resolver
promotes already-staged Markdown for `read`; `reference`, `action`, and
`discarded` delete staging and create no saved article.

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
