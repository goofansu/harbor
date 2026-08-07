import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { withFirecrawlSlot } from "./firecrawl-concurrency.js";

test("queues Firecrawl work after two concurrent requests", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "harbor-firecrawl-limit-"));
  const releases: Array<() => void> = [];
  let active = 0;
  let maximumActive = 0;
  let started = 0;

  const operations = Array.from({ length: 3 }, () =>
    withFirecrawlSlot(
      root,
      async () => {
        active += 1;
        started += 1;
        maximumActive = Math.max(maximumActive, active);
        await new Promise<void>((resolve) => releases.push(resolve));
        active -= 1;
      },
      { pollIntervalMs: 1 },
    ),
  );

  await waitFor(() => started === 2);
  assert.equal(maximumActive, 2);
  assert.equal(started, 2);

  releases.shift()?.();
  await waitFor(() => started === 3);
  assert.equal(maximumActive, 2);

  for (const release of releases) {
    release();
  }
  await Promise.all(operations);
});

async function waitFor(condition: () => boolean): Promise<void> {
  const deadline = Date.now() + 1_000;
  while (!condition()) {
    if (Date.now() >= deadline) {
      throw new Error("Timed out waiting for concurrency state");
    }
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
}
