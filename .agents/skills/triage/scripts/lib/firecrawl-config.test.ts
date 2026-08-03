import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { resolveFirecrawlApiKey } from "./firecrawl-config.js";

test("uses an ambient Firecrawl key before the repository dotenv file", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "harbor-firecrawl-config-"),
  );
  await writeFile(path.join(root, ".env"), "FIRECRAWL_API_KEY=local-key\n");

  assert.equal(
    await resolveFirecrawlApiKey(root, {
      FIRECRAWL_API_KEY: "ambient-key",
    }),
    "ambient-key",
  );
});

test("loads the Firecrawl key from the repository dotenv file", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "harbor-firecrawl-config-"),
  );
  await writeFile(path.join(root, ".env"), 'FIRECRAWL_API_KEY="local-key"\n');

  assert.equal(await resolveFirecrawlApiKey(root, {}), "local-key");
});

test("allows Firecrawl's keyless tier when no key is configured", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "harbor-firecrawl-config-"),
  );

  assert.equal(await resolveFirecrawlApiKey(root, {}), undefined);
});
