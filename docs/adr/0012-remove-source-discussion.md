# ADR 0012: Remove source discussion

- Status: Accepted
- Date: 2026-08-03

## Context

Harbor previously supported discussing a saved source by fetching its live page
body into the conversational agent. This created an indirect prompt-injection
path: arbitrary source text entered agent context while the agent retained
filesystem, browsing, and routing capabilities.

Source discussion is not required for Harbor's core boundary:

```text
saved item -> triage -> decision
```

Structured review data is sufficient for comparing and routing items. Selected
reads already retain cleaned Markdown through a deterministic direct-to-disk
path that bypasses agent context.

## Decision

Remove source discussion from Harbor's supported workflow.

Agents do not fetch live or saved source bodies into context for discussion.
Firecrawl remains limited to page metadata, schema-defined review JSON, and
direct-to-disk Markdown staging. Markdown may be promoted to `saves/` only for a
`read` decision and is not automatically read by the agent.

If a user wants to inspect or discuss an article body, that activity occurs
outside Harbor's triage workflow and does not inherit Harbor routing authority.

## Consequences

- The largest indirect prompt-injection surface is removed from Harbor.
- Harbor remains focused on capture, comparison, decision, and routing.
- Detailed source conversation is no longer a Harbor capability.
- Review JSON and source metadata remain untrusted inputs and still require a
  clear trust boundary.
- Unavailable sources cannot be reconstructed or discussed through Harbor.

## Supersedes

This decision supersedes ADR 0009's native-fetch discussion path and amends ADR
0011 so staged and saved Markdown remain outside agent context.
