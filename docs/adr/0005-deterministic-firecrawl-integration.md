# ADR 0005: Deterministic Firecrawl integration

- Status: Superseded by ADR 0007
- Date: 2026-08-01

## Context

Harbor's agent-driven workflow can use Firecrawl MCP for optional page context,
but reference preservation has stronger requirements than conversational
retrieval. A reference snapshot must contain the exact cleaned Markdown returned
by Firecrawl, remain independent of model inference, and leave the item record
in an auditable state after success or failure.

Capture has a different latency and reliability requirement. Saving a URL must
remain immediate even when Firecrawl is unavailable, slow, or unconfigured.
Combining capture with retrieval would violate Harbor's capture-first product
principle.

The current preservation schema records one `content_hash`, which is ambiguous:
the normalized Markdown body identifies source-content equality, while the
complete snapshot file also contains provenance frontmatter whose bytes may
differ. Harbor needs both identities for deterministic reuse and artifact
integrity.

The official Firecrawl JavaScript and TypeScript SDK is now published as
`firecrawl`. Small skill-internal scripts can make capture and preservation
repeatable without introducing a user-facing CLI, application service, custom
MCP server, database, or new product surface.

## Decision

Add minimal Node.js and TypeScript tooling for internal scripts owned by the
triage skill. These scripts are implementation helpers for agents operating the
Markdown workflow. They are not a public CLI or service, and they do not move
triage judgment, analysis, or routing out of the agent workflow.

### Authentication and secret handling

Load `FIRECRAWL_API_KEY` from a repository-local `.env` file. Ignore `.env` in
Git and provide a committed `.env.example` containing only an empty
`FIRECRAWL_API_KEY=` placeholder.

Never print, persist, or commit the API key. Do not accept it as a command-line
argument, include it in errors, or ask the user to paste it into a conversation.
When no key is available, capture still succeeds and live preservation records
an honest pending state without attempting a network request.

### Deterministic capture

Capture writes a grouped-schema Markdown item into `inbox/` before any optional
retrieval begins. Its required input is the source URL; title and notes remain
optional. The filename and timestamps may be injected for deterministic tests.
Writes are exclusive and atomic so capture never silently replaces an existing
item.

The capture operation does not call Firecrawl. Optional page-context retrieval
is a separate follow-up activity and cannot delay or roll back the saved inbox
record.

### Deterministic reference preservation

Preservation operates on an existing item whose terminal decision is
`reference`. Before the fetch it records `preservation.status: pending`
atomically. It then calls the official `firecrawl` SDK directly with only the
Markdown format and main-content extraction enabled. The returned Markdown body
passes directly from the SDK response to normalization and filesystem writing;
it is not routed through model inference. Harbor does not request or download
images or other assets.

The request defaults to `proxy: "basic"`, constraining its first attempt to
Firecrawl's documented one-credit proxy path, although the scrape API offers no
hard per-request credit cap. If the basic route cannot produce usable Markdown,
Harbor records a pending approval state and the agent asks whether the source
warrants a potentially higher-cost retry. Only explicit user approval
authorizes a second invocation with `proxy: "auto"`, and the script rejects
that mode unless the item records the preceding failed basic attempt. Harbor
never escalates silently.

On success, preservation:

1. normalizes line endings to LF, removes trailing horizontal whitespace,
   removes leading and trailing blank lines, and ends a non-empty body with one
   newline;
2. computes `body_hash` as SHA-256 over the UTF-8 bytes of that normalized
   Markdown body;
3. reuses an existing immutable snapshot when its source URL and `body_hash`
   match;
4. otherwise creates a timestamped snapshot under `exports/reference/` with
   exclusive, atomic file creation and never overwrites an existing snapshot;
5. computes `artifact_hash` as SHA-256 over the complete snapshot file bytes,
   including its provenance frontmatter;
6. updates the reference item atomically only after the destination exists and
   both hashes have been verified.

The item records destination, preservation time, source-fetch time, Firecrawl
provider and requested format, `body_hash`, and `artifact_hash` before becoming
`complete`. Reuse preserves the existing immutable artifact and its original
artifact provenance while recording the successful current fetch time on the
item.

When Firecrawl returns a non-empty author metadata string, Harbor records it
verbatim as `source.author` on the item and on newly created snapshots. Harbor
does not infer an author when the provider omits it. Snapshot reuse does not
rewrite an existing immutable artifact merely to add later metadata, but the
item still records the newly returned author.

If a basic Firecrawl attempt fails, the item is updated atomically to `pending`
with `pending_reason: auto_proxy_approval` and
`failure_reason: basic_proxy_failed`. If an explicitly approved `auto` attempt
or filesystem work fails, the item is updated atomically to `failed` with a
non-secret failure reason and attempt time while retaining any previously
complete snapshot fields. A missing API key results in `pending`, not `failed`,
because no live attempt occurred. The process must never claim `complete`
before durable snapshot creation and item update.

### Idempotency and atomic writes

Body equality, not title, fetch time, or generated filename, determines
snapshot reuse. The `(source URL, body_hash)` pair is the idempotency key.
Separate `artifact_hash` verification detects changes to complete snapshot
bytes.

Atomic item updates use a temporary file in the destination directory followed
by rename. New snapshots use exclusive creation so a collision cannot overwrite
history. A failed rename or write leaves the previous item record or immutable
snapshot intact, apart from an honestly recorded pending or failed transition.

### Firecrawl SDK and MCP roles

The direct `firecrawl` SDK is the deterministic preservation transport and is
mockable for tests. Firecrawl MCP remains available to the conversational agent
for optional review context and as a manual diagnostic fallback. MCP output
must not be substituted into the deterministic preservation pipeline because
doing so would route the retained body through conversational/model context and
weaken reproducibility.

If the direct SDK is unavailable, preservation remains pending or failed and
the agent may use MCP to understand the page during review, but it must not mark
the reference snapshot complete from that fallback.

## Product boundaries

Markdown files remain Harbor's source of truth. The integration adds no
application runtime, public command, server, custom MCP implementation,
authentication system, database, scheduler, asset archive, or general-purpose
bookmarking capability.

Capture and review still do not retain full source content. Only an item already
resolved as `reference` is eligible for deterministic snapshot preservation.
Firecrawl owns URL-to-page retrieval; Harbor and its agent retain responsibility
for comparison, recommendations, decisions, and routing.

## Consequences

Benefits:

- capture remains fast and independent of network or credential availability,
- preserved Markdown has a direct, testable provenance path from Firecrawl,
- body identity and artifact integrity are independently auditable,
- repeated preservation avoids duplicate snapshots when content is unchanged,
- immutable and atomic writes protect item and snapshot history,
- fixtures and injected clients exercise the pipeline without a live API key.

Tradeoffs:

- item and snapshot schemas gain a second hash and attempt metadata,
- direct SDK dependencies require Node.js 22 or later and periodic upgrades,
- pending and failed transitions add operational states agents must surface,
- valuable protected sources may require a user-approved, higher-cost retry,
- atomicity spans individual files rather than a multi-file transaction, so
  recovery relies on honest states and idempotent retry,
- MCP and SDK retrieval paths have intentionally different responsibilities.

## Revisit when

Reconsider this decision if Harbor moves beyond its local agent-driven MVP, if
the official SDK changes its response or authentication contract, if concurrent
writers require transactional coordination beyond atomic files, if a real
destination reference system replaces `exports/reference/`, or if text-only
snapshots no longer preserve the durable value users expect.

## Supersession

ADR 0007 removes direct Firecrawl SDK preservation and its snapshot state
machine. Firecrawl remains optional review context through MCP.
