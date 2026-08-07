import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  parseMarkdownRecord,
  renderMarkdownRecord,
} from "./lib/markdown-record.js";
import { recordOutcome } from "./outcome-core.js";

test("appends an outcome without changing the study decision", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "harbor-outcome-"));
  const itemPath = path.join(root, "resolved", "study", "item.md");
  await mkdir(path.dirname(itemPath), { recursive: true });
  await writeFile(itemPath, resolvedRecord());

  await recordOutcome({
    root,
    itemPath,
    title: "Published response",
    url: "https://example.com/posts/response",
    clock: () => "2026-08-07T10:00:00+08:00",
  });

  const record = parseMarkdownRecord(await readFile(itemPath, "utf8"));
  assert.equal(
    (record.data.resolution as Record<string, unknown>).decision,
    "study",
  );
  assert.equal((record.data.outcomes as { items: unknown[] }).items.length, 1);
});

test("migrates a resolved legacy item when its first outcome is recorded", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "harbor-outcome-"));
  const itemPath = path.join(root, "resolved", "study", "legacy.md");
  await mkdir(path.dirname(itemPath), { recursive: true });
  await writeFile(itemPath, resolvedRecord({ includeOutcomes: false }));

  await recordOutcome({
    root,
    itemPath,
    title: "Published a follow-up post",
    url: "https://example.com/posts/follow-up",
  });

  const record = parseMarkdownRecord(await readFile(itemPath, "utf8"));
  assert.equal((record.data.outcomes as { items: unknown[] }).items.length, 1);
});

function resolvedRecord(options: { includeOutcomes?: boolean } = {}): string {
  return renderMarkdownRecord({
    data: {
      source: { url: "https://example.com", title: "Example" },
      resolution: {
        recommendation: "study",
        decision: "study",
        decided_by: "user",
        reason: "Selected for structured study.",
        resolved_at: "2026-08-07T09:00:00+08:00",
      },
      ...(options.includeOutcomes === false ? {} : { outcomes: { items: [] } }),
    },
    body: "",
  });
}
