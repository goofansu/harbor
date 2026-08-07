# Harbor Agent Guide

Read `CONTEXT.md` before changing Harbor's workflow, product boundary, or
storage conventions. Read applicable records in `docs/adr/` before making an
architecture decision.

## Current phase

Harbor is a local, agent-driven workflow experiment. Do not add application
code, a web UI, authentication, a database, a CLI, or a custom MCP server
unless the user explicitly changes the MVP scope.

Markdown files are the source of truth:

- document the external study-root convention in `docs/agents/harbor.md`,
- put new unresolved items in `inbox/`,
- move resolved items to `resolved/study/` or `resolved/discard/`,
- record substantive batch reviews in `sessions/`.

Follow `.agents/skills/use-harbor/SKILL.md` for capture, review, and resolution
behavior.
Use `.agents/skills/setup-harbor/SKILL.md` when configuring or moving the
external study-workspace root.
Use the grouped YAML frontmatter defined there. Migrate legacy flat records
when they are next reviewed rather than rewriting them without review.

## Firecrawl

Firecrawl is configured for structured review extraction. Use JSON with a
defined schema when structured source metadata or analysis inputs would
materially improve triage. Do not use Firecrawl during capture and do not
request, stage, retain, or place raw source bodies in agent context.

Use the use-harbor skill's internal TypeScript scripts for deterministic capture
and routing. Record Firecrawl fetch provenance, but Harbor does not retain the
fetched page body.

## Product invariants

- Harbor is temporary, not a permanent bookmark or knowledge store.
- Triage checks the study environment first and pauses for `$setup-harbor`
  when it is invalid; after setup, capture asks no item-specific questions.
- Review optimizes for decisions per question.
- Each resolved item has exactly one terminal state: `study` or `discard`.
- Each resolved item preserves a concrete reason.
- Later publications are append-only outcomes and never replace the source's
  terminal decision.
- Useful knowledge is retained before a source is discarded.
- Source facts, Harbor analysis, and user or agent decisions remain explicitly
  distinguishable.
- Novelty is relative to Harbor's corpus and becomes `unknown` when comparison
  evidence is insufficient; freshness alone does not imply novelty.
- A `study` decision may record an external study-workspace destination.
- Harbor does not retain full fetched source content.
- Harbor does not support source discussion or fetch source bodies into agent
  context.
- Teaching artifacts and evidence of learning belong outside Harbor.
- Study workspaces curate their own learning resources; Harbor has no
  bibliography.
- Harbor has no saved-article store; do not create `saves/`.

## Documentation

Keep `README.md` concise and user-facing. Keep durable domain context in
`CONTEXT.md`. Record consequential architecture choices in `docs/adr/`.
Update the use-harbor skill when operational behavior changes.
