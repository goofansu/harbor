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

test("one review scrape records structured JSON without retaining source content", async () => {
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
          metadata: {
            "og:title": "Exact article",
            "article:author": "Metadata Author",
            "article:published_time": "2026-08-01T00:00:00",
          },
          json: {
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

  const record = parseMarkdownRecord(await readFile(itemPath, "utf8"));
  assert.deepEqual(record.data.source, {
    url: "https://example.com/article",
    title: "Exact article",
    author: "Metadata Author",
    published_at: "2026-08-01T00:00:00",
  });
  assert.deepEqual(record.data.analysis, {
    display_title: "Exact article",
    summary: "A concise summary.",
    concepts: ["agents", "review"],
    estimated_read_time: "6 minutes",
    novelty: null,
    novelty_reason: null,
    related_items: [],
    analyzed_at: "2026-08-02T09:30:00+08:00",
  });
  assert.deepEqual(record.data.fetch, {
    provider: "firecrawl",
    fetched_at: "2026-08-02T09:30:00+08:00",
    formats: ["json"],
  });
  assert.deepEqual(record.data.routing, {
    study: {
      status: "not_applicable",
      destinations: [],
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
      routing: {
        study: {
          status: "not_applicable",
          destinations: [],
          routed_at: null,
          failure_reason: null,
        },
      },
    },
    body: "",
  });
}
