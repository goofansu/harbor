# ADR 0020: Route study sources to multiple topics

- Status: Accepted
- Date: 2026-08-07

## Context

A source can contribute to more than one learning mission. The singular
`routing.study.destination` field forced Harbor to choose one topic or leave
useful relationships unrecorded. Storing expanded home-directory paths also
made local metadata noisy and unnecessarily machine-specific.

## Decision

Replace the active singular destination field with:

```yaml
routing:
  study:
    status: complete
    destinations:
      - ~/code/study/software-factories
    routed_at:
    failure_reason:
```

Allow `--study-workspace` to be repeated during resolution. Resolve and validate
every value against the explicit absolute `--study-root`, deduplicate the
result, then store paths beneath the user's home directory with `~` notation.

An empty `destinations` list represents a pending or inapplicable route,
according to `status`. Migrate legacy singular fields when an item is next
reviewed or routed rather than rewriting unresolved history in bulk.

These routes express that a source is relevant to a topic. The external study
workspace still decides whether and how to curate the source in `RESOURCES.md`.

## Consequences

- One source can feed several topic-specific study workspaces.
- Local metadata is portable across machines with the same home-relative study
  convention.
- Callers still pass absolute paths for deterministic environment validation.
- Existing singular routes remain readable as legacy data until reviewed.

## Amends

This decision amends ADR 0016's singular study-workspace handoff without
changing Harbor's study-or-discard boundary.
