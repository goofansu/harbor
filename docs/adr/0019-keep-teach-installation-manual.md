# ADR 0019: Keep teach installation manual

- Status: Accepted
- Date: 2026-08-07

## Context

Topic workspaces rely on the `teach` skill from `mattpocock/skills`. Harbor can
detect whether that dependency is available at the configured study root, but
installing an external skill copies executable agent instructions into a
user-owned workspace.

## Decision

Have `$setup-harbor` check for:

```text
<study-root>/.agents/skills/teach/SKILL.md
```

When it is missing, identify `mattpocock/skills` as the source and tell the user
to install the `teach` skill manually in the study root. Never install or copy
the skill automatically.

Do not create topic workspaces or teaching artifacts during Harbor setup.

## Consequences

- The user explicitly controls external skill installation and updates.
- One study-root installation can serve topic workspaces beneath it.
- Root configuration can succeed before teaching is ready; setup reports the
  missing manual prerequisite clearly.
