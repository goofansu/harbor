# ADR 0011: Stage review Markdown and save selected reads

- Status: Accepted
- Date: 2026-08-02

## Context

Harbor's review workflow requested structured Firecrawl JSON while deliberately
excluding source-body formats. When an item was resolved as `read`, BibTeX
retained only its source metadata and URL. Selecting that bibliography entry
therefore reopened the public URL instead of a local Markdown article.

Making a second Firecrawl request after the decision would duplicate retrieval.
Passing the Markdown response through the conversational agent would also spend
agent context on content that a deterministic adapter can write directly.

ADR 0007 correctly removed required immutable reference snapshots, hashes,
versioning, and preservation state from Harbor. It also left selected reads
without a local reading artifact. References in the current product serve as
metadata-only bookmarks and do not require source-body retention.

## Decision

When Firecrawl is used during review, make one SDK scrape request with two
formats:

- page metadata for source facts and schema-defined JSON for review inputs;
- cleaned main-content Markdown for a possible reading artifact.

The deterministic review helper populates source facts from page metadata and
analysis inputs from schema-defined JSON. It returns only the analysis JSON to
the agent. It writes Markdown to `.cache/firecrawl/<item-id>.md`, records both
requested formats in `fetch`, and records staged article routing separately
from bibliography routing. The cache is gitignored and is not a source of
truth.

All review processes acquire one of two shared filesystem-backed request slots
before invoking Firecrawl. Additional requests wait until a slot is released.
This enforces the free-tier concurrency ceiling across separate agent and
terminal processes, not merely within one Node.js process.

When the terminal decision is `read`, atomically promote the staged Markdown to
`saves/<citation-key>.md`. Add that relative path to the generated BibLaTeX
entry's `file` field. The original URL remains the provenance and fallback
location.

For `reference`, `action`, and `discarded`, delete staged Markdown and do not
create a file under `saves/`. References remain metadata-only bookmarks.

Capture remains retrieval-free. Saved and staged Markdown do not enter agent
context.

Use one current saved file per citation key. Do not add immutable versions,
content hashes, scheduled refreshes, or a preservation state machine. A future
explicit refresh may replace the current saved file.

## Consequences

- Firecrawl-assisted review and read routing use one scrape request.
- At most two Firecrawl scrape requests run concurrently per Harbor repository.
- Article bodies bypass agent context.
- Bibliography selection can open a local Markdown file for selected reads.
- Non-read decisions do not accumulate saved article bodies.
- Review temporarily stores Markdown until a decision is made, so abandoned
  staging files require cache cleanup.
- A read cannot complete its article routing when review Markdown is missing.
- `saves/` is durable Harbor-managed reading output, while `.cache/` remains
  disposable implementation state.

## Amends

This decision narrows ADR 0009's prohibition on review source-body retrieval:
review may request Markdown only as direct-to-disk staging alongside structured
JSON, never as agent context. ADR 0012 subsequently removes source discussion
from the active Harbor workflow.

It amends ADRs 0007 and 0008 by adding one current local attachment for `read`
items only. It does not restore reference snapshots or their former versioning
and hashing machinery.
