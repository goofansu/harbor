# ADR 0021: Remove post-resolution outcomes

- Status: Accepted
- Date: 2026-08-07

## Context

Harbor is a temporary decision queue that decides whether a source deserves
structured study. Publications and other downstream work belong to external
study workspaces. Recording those publications back on resolved Harbor items
adds permanent provenance tracking that is not required for triage.

No Harbor item contains a recorded outcome; existing `outcomes.items`
collections are empty.

## Decision

Remove post-resolution outcomes from Harbor:

- remove `outcomes` from the item model and all existing records;
- stop adding an empty outcomes collection during capture;
- remove the deterministic outcome helper and `harbor:outcome` script;
- keep downstream publications and their provenance outside Harbor.

## Consequences

- Harbor's active workflow is capture, review, and resolution.
- Resolved items retain their terminal decision and reason but do not track
  later publications.
- Study workspaces own downstream learning and creation records.

## Supersedes

This decision supersedes ADR 0013.
