---
name: setup-harbor
description: Configure a Harbor repository's local environment, especially the external root used for topic-specific study workspaces. Use on first setup, when docs/agents/harbor.md is missing or invalid, or when the user wants to move Harbor's study workspace root.
---

# Setup Harbor

Configure the local paths and prerequisites that Harbor's triage workflow
assumes. Follow an explore, recommend, confirm, and write sequence. Do not
overwrite unrelated environment settings.

## 1. Explore

From the Harbor repository root:

1. Read `CONTEXT.md`, `AGENTS.md`, and the latest applicable ADRs.
2. Confirm `.agents/skills/triage/` exists.
3. Read `docs/agents/harbor.md` when it exists and interpret the study-root
   convention stated in its prose. Do not require frontmatter or ask a script
   to parse the document.
4. Resolve `~` and other user-relative notation to an absolute path. Check
   whether the root exists, is a directory, and is outside Harbor.
5. Inspect `resolved/study/` routing metadata for existing destinations without
   changing them.
6. Report whether Firecrawl is authenticated, keyless, or unavailable without
   revealing credentials. Firecrawl is optional.

## 2. Recommend and confirm

Recommend one study root outside Harbor. Default to `~/study` when no stronger
convention exists. Show both the readable convention and its resolved absolute
path when they differ.

Explain that the root contains separate topic workspaces:

```text
<study-root>/
├── speculative-decoding/
└── mechanistic-interpretability/
```

Ask one question:

> Use `<absolute-path>` as Harbor's study root and create it if missing?

Do not edit files or create an external directory until the user confirms.

## 3. Write

After confirmation:

1. Resolve the convention to an absolute path and ensure it is not Harbor
   itself or a directory inside Harbor.
2. Create or update `docs/agents/harbor.md` as ordinary Markdown prose. Keep it
   concise and preserve unrelated guidance. For example:

   ```markdown
   # Harbor environment

   Use `~/study` as the root for topic-specific study workspaces.
   ```

   Do not add frontmatter solely for this setting. The document is read and
   interpreted by an agent, not parsed by a script.

3. Invoke the deterministic helper with the resolved absolute path:

   ```text
   npm run harbor:setup -- --study-root /absolute/path
   ```

   The helper validates the path and creates the directory. It does not read or
   write the Markdown configuration.

4. Do not create a topic workspace, `MISSION.md`, lessons, or learning records
   during setup.
5. Do not rewrite existing `routing.study.destination` values. They are
   historical item routes.

## 4. Verify

Verify without revealing secrets:

- read `docs/agents/harbor.md`, resolve its study-root convention, and run
  `npm run harbor:setup:check -- --study-root /absolute/path`;
- `npm run typecheck` succeeds.

Then explain usage:

```text
npm run harbor:resolve -- \
  --item inbox/item.md \
  --decision study \
  --reason "Worth structured study" \
  --study-root /absolute/path \
  --study-workspace speculative-decoding
```

A relative `--study-workspace` resolves beneath `--study-root`. An absolute
value overrides the root for that destination. Omitting `--study-workspace`
leaves the study route pending.

## Reconfiguration

Re-run this skill to change the root. Confirm the new location before writing.
Changing the root affects future relative routes only; never move existing
study artifacts or rewrite resolved item history unless the user separately
requests that migration.
