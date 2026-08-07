import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { configureHarbor } from "./configure-core.js";

test("creates the external root", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "setup-harbor-"));
  const harborRoot = path.join(parent, "harbor");
  const studyRoot = path.join(parent, "study");
  await mkdir(harborRoot);

  await configureHarbor({ harborRoot, studyRoot });

  await access(studyRoot);
});

test("does not use or modify dotenv configuration", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "setup-harbor-"));
  const harborRoot = path.join(parent, "harbor");
  const studyRoot = path.join(parent, "study");
  const envContents = "FIRECRAWL_API_KEY=secret-value\n";
  await mkdir(harborRoot);
  await writeFile(path.join(harborRoot, ".env"), envContents);

  await configureHarbor({ harborRoot, studyRoot });

  assert.equal(
    await readFile(path.join(harborRoot, ".env"), "utf8"),
    envContents,
  );
});

test("rejects a study root inside Harbor", async () => {
  const harborRoot = await mkdtemp(path.join(os.tmpdir(), "setup-harbor-"));

  await assert.rejects(
    configureHarbor({
      harborRoot,
      studyRoot: path.join(harborRoot, "study"),
    }),
    /must be outside Harbor/,
  );
});

test("rejects a relative study root", async () => {
  const harborRoot = await mkdtemp(path.join(os.tmpdir(), "setup-harbor-"));

  await assert.rejects(
    configureHarbor({ harborRoot, studyRoot: "../study" }),
    /must be an absolute path/,
  );
});
