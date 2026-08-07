import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  parseMarkdownRecord,
  renderMarkdownRecord,
} from "./lib/markdown-record.js";
import { resolveItem } from "./resolve-core.js";

test("study resolution records multiple abbreviated workspace destinations", async () => {
  const { root, itemPath } = await fixture();
  const workspace = path.join(os.homedir(), "code", "study", "agents");
  const secondWorkspace = path.join(os.homedir(), "code", "study", "testing");
  const result = await resolveItem({
    root,
    itemPath,
    decision: "study",
    reason: "The source deserves structured study.",
    studyWorkspaces: [workspace, secondWorkspace],
    clock: () => "2026-08-07T10:00:00+08:00",
  });

  assert.equal(
    path.relative(root, result.itemPath),
    "resolved/study/20260807090000-example.md",
  );
  const record = parseMarkdownRecord(await readFile(result.itemPath, "utf8"));
  assert.equal(
    (record.data.resolution as Record<string, unknown>).decision,
    "study",
  );
  assert.deepEqual(record.data.routing, {
    study: {
      status: "complete",
      destinations: ["~/code/study/agents", "~/code/study/testing"],
      routed_at: "2026-08-07T10:00:00+08:00",
      failure_reason: null,
    },
  });
  assert.equal(record.data.maintenance, undefined);
});

test("study resolution can remain pending until a workspace is chosen", async () => {
  const { root, itemPath } = await fixture();
  const result = await resolveItem({
    root,
    itemPath,
    decision: "study",
    reason: "Worth learning when a focused workspace is available.",
  });

  const record = parseMarkdownRecord(await readFile(result.itemPath, "utf8"));
  assert.deepEqual((record.data.routing as Record<string, unknown>).study, {
    status: "pending",
    destinations: [],
    routed_at: null,
    failure_reason: null,
  });
});

test("discard resolution records no downstream route", async () => {
  const { root, itemPath } = await fixture();
  const result = await resolveItem({
    root,
    itemPath,
    decision: "discard",
    reason: "It duplicates a clearer source.",
  });

  assert.equal(
    path.relative(root, result.itemPath),
    "resolved/discard/20260807090000-example.md",
  );
  const record = parseMarkdownRecord(await readFile(result.itemPath, "utf8"));
  assert.deepEqual((record.data.routing as Record<string, unknown>).study, {
    status: "not_applicable",
    destinations: [],
    routed_at: null,
    failure_reason: null,
  });
});

async function fixture(): Promise<{ root: string; itemPath: string }> {
  const root = await mkdtemp(path.join(os.tmpdir(), "harbor-resolve-"));
  const itemPath = path.join(root, "inbox", "20260807090000-example.md");
  await mkdir(path.dirname(itemPath), { recursive: true });
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
          saved_at: "2026-08-07T09:00:00+08:00",
          saved_by: "user",
        },
        fetch: { provider: null, fetched_at: null, formats: [] },
        analysis: {
          display_title: "Article",
          summary: "Summary",
          concepts: [],
          estimated_read_time: "1 minute",
          novelty: "unknown",
          novelty_reason: "No comparison corpus.",
          related_items: [],
          analyzed_at: "2026-08-07T09:30:00+08:00",
        },
        resolution: {
          recommendation: "study",
          decision: null,
          decided_by: null,
          reason: null,
          resolved_at: null,
        },
        maintenance: {
          policy: "on_related_item",
          state: "current",
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
        },
      },
      body: "",
    }),
  );
  return { root, itemPath };
}
