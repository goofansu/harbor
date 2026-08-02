import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  parseMarkdownRecord,
  renderMarkdownRecord,
} from "./lib/markdown-record.js";
import { resolveItem } from "./resolve-core.js";

test("read resolution promotes staged Markdown into saves", async () => {
  const { root, itemPath, stagedPath } = await fixture();
  const result = await resolveItem({
    root,
    itemPath,
    decision: "read",
    reason: "The source deserves focused reading.",
    clock: () => "2026-08-02T10:00:00+08:00",
  });

  assert.equal(
    path.relative(root, result.savedArticlePath ?? ""),
    "saves/harbor20260802090000example.md",
  );
  assert.equal(await readFile(result.savedArticlePath!, "utf8"), "# Article\n");
  await assert.rejects(access(stagedPath));

  const record = parseMarkdownRecord(await readFile(result.itemPath, "utf8"));
  assert.deepEqual(record.data.routing, {
    article: {
      status: "complete",
      destination: "saves/harbor20260802090000example.md",
      staged_at: "2026-08-02T09:30:00+08:00",
      saved_at: "2026-08-02T10:00:00+08:00",
      failure_reason: null,
    },
    bibliography: {
      status: "not_applicable",
      destination: null,
      citation_key: null,
      routed_at: null,
      failure_reason: null,
    },
  });
});

test("reference resolution discards staging and creates no save", async () => {
  const { root, itemPath, stagedPath } = await fixture();
  const result = await resolveItem({
    root,
    itemPath,
    decision: "reference",
    reason: "Useful as a metadata-only bookmark.",
    clock: () => "2026-08-02T10:00:00+08:00",
  });

  assert.equal(result.savedArticlePath, undefined);
  await assert.rejects(access(stagedPath));
  await assert.rejects(access(path.join(root, "saves")));
});

async function fixture(): Promise<{
  root: string;
  itemPath: string;
  stagedPath: string;
}> {
  const root = await mkdtemp(path.join(os.tmpdir(), "harbor-resolve-"));
  const itemPath = path.join(root, "inbox", "20260802090000-example.md");
  const stagedPath = path.join(
    root,
    ".cache",
    "firecrawl",
    "20260802090000-example.md",
  );
  await Promise.all([
    mkdir(path.dirname(itemPath), { recursive: true }),
    mkdir(path.dirname(stagedPath), { recursive: true }),
  ]);
  await writeFile(stagedPath, "# Article\n");
  await writeFile(
    itemPath,
    renderMarkdownRecord({
      data: {
        source: {
          url: "https://example.com/article",
          title: "Article",
          author: null,
          published_at: null,
        },
        capture: {
          saved_at: "2026-08-02T09:00:00+08:00",
          saved_by: "user",
        },
        fetch: {
          provider: "firecrawl",
          fetched_at: "2026-08-02T09:30:00+08:00",
          formats: ["json", "markdown"],
        },
        analysis: {
          display_title: "Article",
          summary: "Summary",
          concepts: [],
          estimated_read_time: "1 minute",
          novelty: "unknown",
          novelty_reason: "No comparison corpus.",
          related_items: [],
          analyzed_at: "2026-08-02T09:30:00+08:00",
        },
        resolution: {
          recommendation: "read",
          decision: null,
          decided_by: null,
          reason: null,
          resolved_at: null,
        },
        maintenance: {
          policy: null,
          state: null,
          last_reviewed_at: null,
          review_after: null,
        },
        routing: {
          article: {
            status: "staged",
            destination: ".cache/firecrawl/20260802090000-example.md",
            staged_at: "2026-08-02T09:30:00+08:00",
            saved_at: null,
            failure_reason: null,
          },
          bibliography: {
            status: "not_applicable",
            destination: null,
            citation_key: null,
            routed_at: null,
            failure_reason: null,
          },
        },
      },
      body: "",
    }),
  );
  return { root, itemPath, stagedPath };
}
