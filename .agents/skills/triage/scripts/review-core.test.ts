import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  parseMarkdownRecord,
  renderMarkdownRecord,
} from "./lib/markdown-record.js";
import { reviewItem } from "./review-core.js";

test("one review scrape records JSON while staging Markdown outside agent output", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "harbor-review-"));
  const itemPath = path.join(root, "inbox", "20260802090000-example.md");
  await mkdir(path.dirname(itemPath), { recursive: true });
  await writeFile(itemPath, inboxRecord());

  let calls = 0;
  const result = await reviewItem({
    root,
    itemPath,
    clock: () => "2026-08-02T09:30:00+08:00",
    scraper: {
      async scrape(url) {
        calls += 1;
        assert.equal(url, "https://example.com/article");
        return {
          markdown: "# Exact article\n\nFull source body.",
          json: {
            source_title: "Exact article",
            author: "Example Author",
            published_at: "2026-08-01",
            summary: "A concise summary.",
            concepts: ["agents", "review"],
            estimated_read_time: "6 minutes",
          },
        };
      },
    },
  });

  assert.equal(calls, 1);
  assert.deepEqual(result.extraction.concepts, ["agents", "review"]);
  assert.equal(
    await readFile(result.stagedPath, "utf8"),
    "# Exact article\n\nFull source body.\n",
  );

  const record = parseMarkdownRecord(await readFile(itemPath, "utf8"));
  assert.deepEqual(record.data.fetch, {
    provider: "firecrawl",
    fetched_at: "2026-08-02T09:30:00+08:00",
    formats: ["json", "markdown"],
  });
  assert.deepEqual(record.data.routing, {
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
  });
});

function inboxRecord(): string {
  return renderMarkdownRecord({
    data: {
      source: {
        url: "https://example.com/article",
        title: null,
        author: null,
        published_at: null,
      },
      capture: {
        saved_at: "2026-08-02T09:00:00+08:00",
        saved_by: "user",
      },
      fetch: { provider: null, fetched_at: null, formats: [] },
      analysis: {
        display_title: null,
        summary: null,
        concepts: [],
        estimated_read_time: null,
        novelty: null,
        novelty_reason: null,
        related_items: [],
        analyzed_at: null,
      },
      resolution: {
        recommendation: null,
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
          status: "not_applicable",
          destination: null,
          staged_at: null,
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
  });
}
