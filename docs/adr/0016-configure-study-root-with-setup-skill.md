# ADR 0016: Configure the study root with a setup skill

- Status: Accepted
- Date: 2026-08-07

## Context

Harbor can record an external study-workspace destination, but requiring an
absolute `--study-workspace` path for every resolution is repetitive and leaves
first-time environment setup implicit. A single workspace for all topics would
also conflict with the guided-study model, where each learning mission owns its
own stateful directory.

## Decision

Add a repo-local, user-invoked `$setup-harbor` skill following an explore,
recommend, confirm, and write workflow. Record the study-root convention as
ordinary prose in `docs/agents/harbor.md`. Do not require frontmatter.

Use a deterministic `npm run harbor:setup -- --study-root <absolute-path>`
helper to validate and create the confirmed root. The agent interprets the
Markdown convention, resolves it to an absolute path, and passes that path to
scripts explicitly. Scripts do not parse the Markdown.

Treat `--study-workspace` as:

- an exact override when absolute;
- a topic-specific directory beneath the explicit `--study-root` when relative;
- omitted when the study route should remain pending.

The setup skill may create the confirmed root directory but does not create
topic workspaces or teaching artifacts. Reconfiguration affects future routes
and never rewrites resolved history automatically.

## Consequences

- First-time setup becomes discoverable and repeatable.
- Topic routes can use short names without collapsing unrelated learning
  missions into one workspace.
- The study convention is visible alongside other agent guidance.
- `.env` remains reserved for secrets and process configuration.
- Existing absolute-path behavior remains compatible.

## Amends

This decision adds agent-readable configuration to ADR 0014's external
study-workspace routing without changing Harbor's study-or-discard boundary.
