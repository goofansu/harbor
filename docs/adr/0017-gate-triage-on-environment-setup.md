# ADR 0017: Gate triage on environment setup

- Status: Accepted
- Date: 2026-08-07

## Context

Harbor can capture and review without a study root, but allowing triage to
proceed in an unconfigured repository defers the missing-environment failure
until a source is routed for study. The user wants setup to be an explicit
precondition of invoking the triage workflow.

## Decision

Before every triage operation, read `docs/agents/harbor.md`, interpret its
study-root convention, resolve it to an absolute path, and pass it to
`npm run harbor:setup:check -- --study-root <absolute-path>`. The preflight
validates that the supplied path is external and that the directory exists.

When the check fails, perform no capture, review, resolution, or outcome
mutation. Ask the user to invoke `$setup-harbor`; do not silently choose a path
or run setup without agreement.

Once the check succeeds, retain the existing question-free capture behavior.
The agent passes the same resolved root explicitly to resolver invocations.
Scripts do not parse Markdown or infer the root from `.env`.

## Consequences

- Environment failures occur before Harbor mutates workflow state.
- First capture may pause for one-time setup.
- Capture remains frictionless after setup.
- Triage and setup share one deterministic validation path.

## Amends

This decision adds an invocation gate to ADR 0016 and narrows the earlier
capture-without-interruption principle to repositories whose environment is
already valid.
