# Harbor Agent Guide

Read `CONTEXT.md` before changing Harbor's workflow, product boundary, or
storage conventions. Read applicable records in `docs/adr/` before making an
architecture decision.

## Current phase

Harbor is a local, agent-driven workflow experiment. Do not add application
code, a web UI, authentication, a database, a CLI, or a custom MCP server
unless the user explicitly changes the MVP scope.

Markdown files are the source of truth:

- put new unresolved items in `inbox/`,
- move resolved items to one of the four `resolved/` subdirectories,
- record substantive batch reviews in `sessions/`.

Follow `.agents/skills/triage/SKILL.md` for capture, review, and resolution
behavior.
Use the grouped YAML frontmatter defined there. Migrate legacy flat records
when they are next reviewed rather than rewriting them without review.

## Firecrawl

Firecrawl MCP is configured for structured review extraction. Use JSON with a
defined schema when structured source metadata or analysis inputs would
materially improve triage. Do not use Firecrawl during capture. The
deterministic review helper may request Markdown only for direct-to-disk staging
alongside structured JSON; never place that Markdown or another source body in
agent context.

Use the triage skill's internal TypeScript scripts for deterministic capture and
BibTeX routing. Record Firecrawl fetch provenance, but Harbor does not retain
the fetched page body.

## Product invariants

- Harbor is temporary, not a permanent bookmark or knowledge store.
- Capture does not interrupt the user with questions.
- Review optimizes for decisions per question.
- Each resolved item has exactly one terminal state: `read`, `reference`,
  `action`, or `discarded`.
- Each resolved item preserves a concrete reason.
- Later publications are append-only outcomes and never replace the source's
  terminal decision.
- Useful knowledge is retained before a source is discarded.
- Source facts, Harbor analysis, and user or agent decisions remain explicitly
  distinguishable.
- Novelty is relative to Harbor's corpus and becomes `unknown` when comparison
  evidence is insufficient; freshness alone does not imply novelty.
- References default to event-driven `on_related_item` maintenance.
- A `reference` decision retains the Harbor item and may route it to BibTeX.
- Harbor does not retain full fetched source content.
- Harbor does not support source discussion or fetch source bodies into agent
  context.
- Maintenance never silently changes a terminal decision.
- Do not introduce broad scheduled re-fetching; long-term reference-library
  upkeep belongs outside Harbor.

## Documentation

Keep `README.md` concise and user-facing. Keep durable domain context in
`CONTEXT.md`. Record consequential architecture choices in `docs/adr/`.
Update the triage skill when operational behavior changes.
