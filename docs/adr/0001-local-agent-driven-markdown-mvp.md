# ADR 0001: Local agent-driven markdown MVP

- Status: Accepted
- Date: 2026-08-01

## Context

Harbor's riskiest assumption is behavioral: an agent can turn an accumulating
read-later inbox into confident decisions with few user questions.
Infrastructure does not validate that assumption.

The project already has access to Firecrawl MCP for retrieving page context.
The agent can operate directly on local files while the workflow is still
changing.

## Decision

Build the initial Harbor experience as an interactive ChatGPT/Codex workflow.
Use a repository skill for operating instructions and markdown files for inbox,
resolved-item, and review-session state.

Use Firecrawl only for `URL -> page context`. Keep comparison,
recommendation, questioning, and routing in Harbor's agent workflow.

Do not build application code, a UI, authentication, a database, a CLI, or a
custom MCP server during this phase.

## Consequences

Benefits:

- workflow changes remain cheap,
- decisions and reasoning are inspectable,
- no infrastructure is needed to test the product premise,
- Firecrawl can improve context without controlling the workflow.

Tradeoffs:

- concurrent editing and large inboxes are not optimized,
- markdown conventions require agent discipline,
- integrations with reference and task systems remain manual or explicitly
  user-directed,
- service boundaries and APIs are deferred.

## Revisit when

Reconsider this decision after repeated review sessions demonstrate high
resolution rates, low question counts, and acceptable deletion regret, or when
file-based operation becomes the main constraint on a validated workflow.

## Amendment

Minimal skill-internal TypeScript scripts support deterministic Markdown
capture and BibTeX routing. These helpers do not create a user-facing CLI,
application, or service and do not change the local agent-driven product
boundary. ADR 0007 removes the later direct Firecrawl snapshot helper.
