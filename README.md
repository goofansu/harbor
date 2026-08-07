# Harbor

Harbor is an AI-native study triage system: a temporary place where saved
links arrive, get evaluated, and leave the inbox through one of two decisions.

```text
saved item -> triage -> study | discard
```

Harbor owns capture through decision. It is not a bookmark manager, knowledge
base, task manager, article reader, source archive, or teaching workspace.

| Decision  | Meaning                                      | Destination      |
| --------- | -------------------------------------------- | ---------------- |
| `study`   | Invest deliberate effort to understand it    | Study workspace  |
| `discard` | It does not deserve further active attention | Resolved history |

`study` records an intention, not proof that the source was consumed,
understood, or retained. Guided lessons and learning records belong in a
separate study workspace.

## Repository

```text
harbor/
├── AGENTS.md
├── CONTEXT.md
├── README.md
├── docs/
│   ├── agents/
│   └── adr/
├── .agents/skills/setup-harbor/
├── .agents/skills/use-harbor/
├── inbox/
├── resolved/
│   ├── study/
│   └── discard/
└── sessions/
```

- `inbox/` contains unresolved items.
- `resolved/` contains items grouped by terminal decision.
- `sessions/` contains concise batch-review records.
- `docs/agents/harbor.md` documents the external study-root convention.
- `.agents/skills/setup-harbor/` configures that convention.
- `.agents/skills/use-harbor/` defines the workflow and deterministic helpers.

## Using the MVP

Run `$setup-harbor` once to configure an external study root. It records the
location as ordinary prose in `docs/agents/harbor.md`; `.env` remains available
for secrets such as the Firecrawl API key. Setup also checks for the `teach`
skill from `mattpocock/skills` under the study root. When it is missing, setup
asks you to install it manually and never installs external code itself.

Every `$use-harbor` invocation reads that guidance, resolves the location, and
passes it to `npm run harbor:setup:check` explicitly. If the documented root is
missing or invalid, triage pauses before changing Harbor and asks you to invoke
`$setup-harbor`.

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
npm run harbor:resolve -- --item inbox/item.md --decision study --reason "..." --study-root /absolute/path
npm run harbor:resolve -- --item inbox/item.md --decision discard --reason "..." --study-root /absolute/path
```

Repeat the optional `--study-workspace <path-or-topic>` argument to record every
topic a studied source can serve. The agent also supplies the documented
absolute root through `--study-root`. Relative topic names resolve beneath that
root; absolute paths override it. Stored destinations beneath the user's home
directory use abbreviated paths such as `~/code/study/software-factories`. The
guided-study skill is invoked from those external workspaces, not from Harbor.

Each item separates:

- `source`: page facts,
- `capture`: intake provenance,
- `fetch`: retrieval provenance,
- `analysis`: Harbor's derived judgments,
- `resolution`: recommendation and terminal decision,
- `routing.study`: the external study-workspace handoffs; a source may serve
  multiple topics.

Study workspaces curate the sources actually used for learning in their own
`RESOURCES.md`. Harbor preserves the selected source's URL and analysis but does
not maintain a separate bibliography.

## Success signals

- resolution rate,
- items resolved per review session,
- average inbox age,
- confidence when discarding,
- regret after deletion,
- selected sources that become active study.
