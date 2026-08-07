import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  citationKeyForItem,
  exportBibtexEntry,
  upsertManagedEntry,
} from "./bibtex-core.js";
import {
  parseMarkdownRecord,
  renderMarkdownRecord,
} from "./lib/markdown-record.js";

test("exports a fixed public-website @online entry without rewriting manual entries", async () => {
  const { root, itemPath, bibliographyPath } = await fixture();
  const manual = [
    "@book{manual2025,",
    "  title = {Manual Entry},",
    "  year = {2025}",
    "}",
    "",
  ].join("\n");
  await writeFile(bibliographyPath, manual);

  const result = await exportBibtexEntry({
    root,
    itemPath,
    bibliographyPath,
    clock: () => "2026-08-01T16:00:00+08:00",
  });

  assert.equal(result.citationKey, "harbor20260801122247promptcaching");
  const bibliography = await readFile(bibliographyPath, "utf8");
  assert.ok(bibliography.startsWith(manual));
  assert.match(bibliography, /@online\{harbor20260801122247promptcaching,/);
  assert.match(bibliography, /author = \{Example Author\}/);
  assert.match(bibliography, /title = \{Prompt Caching \\& Agents\}/);
  assert.match(bibliography, /date = \{2026-07-22\}/);
  assert.match(
    bibliography,
    /url = \{https:\/\/example\.com\/prompt-caching\}/,
  );
  assert.match(bibliography, /urldate = \{2026-08-01\}/);

  const item = parseMarkdownRecord(await readFile(itemPath, "utf8"));
  assert.deepEqual(item.data.routing, {
    bibliography: {
      status: "complete",
      destination: "../notes/reference.bib",
      citation_key: result.citationKey,
      routed_at: "2026-08-01T16:00:00+08:00",
      failure_reason: null,
    },
  });
});

test("re-export replaces its managed block and does not duplicate it", async () => {
  const { root, itemPath, bibliographyPath } = await fixture();
  await exportBibtexEntry({
    root,
    itemPath,
    bibliographyPath,
    clock: () => "2026-08-01T16:00:00+08:00",
  });

  const item = parseMarkdownRecord(await readFile(itemPath, "utf8"));
  const source = item.data.source as Record<string, unknown>;
  source.title = "Updated title";
  await writeFile(itemPath, renderMarkdownRecord(item));

  const result = await exportBibtexEntry({
    root,
    itemPath,
    bibliographyPath,
    clock: () => "2026-08-01T16:01:00+08:00",
  });
  assert.equal(result.updated, true);

  const bibliography = await readFile(bibliographyPath, "utf8");
  assert.equal(
    bibliography.match(/% harbor-begin: 20260801-122247-prompt-caching/g)
      ?.length,
    1,
  );
  assert.match(bibliography, /title = \{Updated title\}/);
  assert.doesNotMatch(bibliography, /Prompt Caching/);

  const third = await exportBibtexEntry({
    root,
    itemPath,
    bibliographyPath,
    clock: () => "2026-08-01T16:02:00+08:00",
  });
  assert.equal(third.updated, false);
  const afterThird = parseMarkdownRecord(await readFile(itemPath, "utf8"));
  assert.equal(
    (
      (afterThird.data.routing as Record<string, unknown>)
        .bibliography as Record<string, unknown>
    ).routed_at,
    "2026-08-01T16:01:00+08:00",
  );
});

test("study entries remain URL-only", async () => {
  const { root, itemPath, bibliographyPath } = await fixture();
  await exportBibtexEntry({
    root,
    itemPath,
    bibliographyPath,
    clock: () => "2026-08-01T16:00:00+08:00",
  });
  assert.doesNotMatch(await readFile(bibliographyPath, "utf8"), /file =/);
});

test("rejects discard items", async () => {
  const { root, itemPath, bibliographyPath } = await fixture();
  const item = parseMarkdownRecord(await readFile(itemPath, "utf8"));
  const resolution = item.data.resolution as Record<string, unknown>;
  resolution.decision = "discard";
  await writeFile(itemPath, renderMarkdownRecord(item));

  await assert.rejects(
    exportBibtexEntry({
      root,
      itemPath,
      bibliographyPath,
    }),
    /Only items resolved as study/,
  );
});

test("omits author when Harbor has no source author", async () => {
  const { root, itemPath, bibliographyPath } = await fixture();
  const item = parseMarkdownRecord(await readFile(itemPath, "utf8"));
  const source = item.data.source as Record<string, unknown>;
  source.author = null;
  await writeFile(itemPath, renderMarkdownRecord(item));

  await exportBibtexEntry({
    root,
    itemPath,
    bibliographyPath,
    clock: () => "2026-08-01T16:00:00+08:00",
  });

  const bibliography = await readFile(bibliographyPath, "utf8");
  assert.doesNotMatch(bibliography, /author =/);
});

test("uses the capture date when an item was not fetched", async () => {
  const { root, itemPath, bibliographyPath } = await fixture();
  const item = parseMarkdownRecord(await readFile(itemPath, "utf8"));
  const fetch = item.data.fetch as Record<string, unknown>;
  fetch.fetched_at = null;
  item.data.capture = {
    saved_at: "2026-07-30T09:00:00+08:00",
    saved_by: "user",
  };
  await writeFile(itemPath, renderMarkdownRecord(item));

  await exportBibtexEntry({
    root,
    itemPath,
    bibliographyPath,
    clock: () => "2026-08-01T16:00:00+08:00",
  });

  const bibliography = await readFile(bibliographyPath, "utf8");
  assert.match(bibliography, /urldate = \{2026-07-30\}/);
});

test("citation keys are deterministic BibTeX identifiers", () => {
  assert.equal(
    citationKeyForItem("20260801-122247-prompt-caching"),
    "harbor20260801122247promptcaching",
  );
});

test("malformed managed blocks are rejected instead of rewriting the bibliography", () => {
  assert.throws(
    () =>
      upsertManagedEntry(
        "% harbor-begin: item\n@online{harboritem}\n",
        "item",
        "replacement\n",
      ),
    /Malformed Harbor BibTeX block/,
  );
});

async function fixture(): Promise<{
  root: string;
  itemPath: string;
  bibliographyPath: string;
}> {
  const parent = await mkdtemp(path.join(os.tmpdir(), "harbor-bibtex-"));
  const root = path.join(parent, "harbor");
  const notes = path.join(parent, "notes");
  const itemPath = path.join(
    root,
    "resolved",
    "study",
    "20260801-122247-prompt-caching.md",
  );
  const bibliographyPath = path.join(notes, "reference.bib");
  await Promise.all([
    mkdir(path.dirname(itemPath), { recursive: true }),
    mkdir(notes, { recursive: true }),
  ]);
  await writeFile(
    itemPath,
    renderMarkdownRecord({
      data: {
        source: {
          url: "https://example.com/prompt-caching",
          title: "Prompt Caching & Agents",
          author: "Example Author",
          published_at: "2026-07-22",
        },
        fetch: {
          provider: "firecrawl",
          fetched_at: "2026-08-01T13:29:26+08:00",
          formats: ["json"],
        },
        analysis: {
          display_title: "Prompt Caching and Agents",
        },
        resolution: {
          decision: "study",
        },
      },
      body: "",
    }),
  );
  return { root, itemPath, bibliographyPath };
}
