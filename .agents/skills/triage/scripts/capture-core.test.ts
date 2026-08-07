import assert from "node:assert/strict";
import { mkdtemp, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { capture } from "./capture-core.js";
import { readUtf8 } from "./lib/files.js";
import { parseMarkdownRecord, requireGroup } from "./lib/markdown-record.js";

const captureTime = "2026-08-01T10:00:00+08:00";

test("capture immediately writes a grouped inbox record without retrieval", async () => {
  const root = await createHarborRoot();
  const result = await capture({
    root,
    url: resultUrl(),
    title: "Deterministic Systems",
    notes: "Review with the architecture items.",
    clock: () => captureTime,
  });

  assert.equal(
    result.relativePath,
    "inbox/20260801100000-deterministic-systems.md",
  );
  const parsed = parseMarkdownRecord(await readUtf8(result.itemPath));
  assert.equal(requireGroup(parsed.data, "source").url, resultUrl());
  assert.equal(requireGroup(parsed.data, "capture").saved_at, captureTime);
  assert.deepEqual(parsed.data.outcomes, { items: [] });
  assert.deepEqual(parsed.data.routing, {
    study: {
      status: "not_applicable",
      destination: null,
      routed_at: null,
      failure_reason: null,
    },
  });
  assert.equal(parsed.data.preservation, undefined);
  assert.match(parsed.body, /Review with the architecture items\./);
});

test("capture never overwrites a same-second filename collision", async () => {
  const root = await createHarborRoot();
  const input = {
    root,
    url: resultUrl(),
    title: "Deterministic Systems",
    clock: () => captureTime,
  };

  const first = await capture(input);
  const second = await capture(input);

  assert.notEqual(first.itemPath, second.itemPath);
  assert.equal(
    path.basename(second.itemPath),
    "20260801100000-deterministic-systems-2.md",
  );
});

async function createHarborRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "harbor-capture-"));
  await mkdir(path.join(root, "inbox"), { recursive: true });
  return root;
}

function resultUrl(): string {
  return "https://example.com/articles/determinism";
}
