# ADR 0014: Reduce resolution to study or discard

- Status: Accepted
- Date: 2026-08-07

## Context

Harbor previously resolved sources as `read`, `reference`, `action`, or
`discarded`. In the intended use case, those distinctions dilute the central
question: whether a source deserves deliberate learning effort.

`read` describes consumption rather than motivation. `learn` would overstate an
outcome that Harbor cannot verify. `study` describes the intentional downstream
activity without claiming understanding occurred.

The former read workflow also staged and preserved raw Markdown. Guided study
can research trusted sources when a learning session begins; Harbor does not
need source bodies to decide whether a topic deserves study.

## Decision

Use exactly two terminal decisions:

- `study`: route the source toward structured learning;
- `discard`: end active attention while preserving the reason.

A study item may record an external workspace destination, but Harbor does not
create teaching artifacts or invoke the teaching skill. ADR 0018 subsequently
removes the bibliography export that originally accompanied study decisions.

Firecrawl-assisted review requests page metadata and structured JSON only.
Harbor no longer stages Markdown or creates saved article files.

Migrate existing `read` and `reference` records to `study`. Migrate
`discarded` records to `discard`. No `action` records existed when this
decision was adopted. ADR 0015 subsequently removes the former `saves/`
directory and its stale bibliography attachment fields.

## Consequences

- Review questions become binary and more motivated.
- Study completion, practice, and retention remain outside Harbor.
- Harbor no longer performs reference maintenance or task routing.
- Harbor creates no saved article files.

## Supersedes

This decision supersedes the active resolution and routing behavior in ADRs
0003, 0006, 0008, and 0011. ADR 0018 supersedes its bibliography behavior. This
decision preserves ADR 0012's prohibition on source discussion.
