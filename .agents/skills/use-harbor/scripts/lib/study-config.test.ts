import assert from "node:assert/strict";
import { mkdir, mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  abbreviateUserPath,
  checkStudyEnvironment,
  requireStudyRoot,
  resolveStudyWorkspaces,
} from "./study-config.js";

test("resolves a topic workspace beneath the supplied root", async () => {
  const harborRoot = await mkdtemp(
    path.join(os.tmpdir(), "harbor-study-config-"),
  );

  assert.deepEqual(
    await resolveStudyWorkspaces(
      harborRoot,
      ["speculative-decoding"],
      "/learning",
    ),
    ["/learning/speculative-decoding"],
  );
});

test("accepts and deduplicates multiple workspaces while validating the supplied root", async () => {
  const harborRoot = await mkdtemp(
    path.join(os.tmpdir(), "harbor-study-config-"),
  );

  assert.deepEqual(
    await resolveStudyWorkspaces(
      harborRoot,
      ["/learning/topic", "other-topic", "/learning/topic"],
      "/study",
    ),
    ["/learning/topic", "/study/other-topic"],
  );
});

test("abbreviates destinations beneath the user's home directory", () => {
  assert.equal(
    abbreviateUserPath("/Users/example/code/study/topic", "/Users/example"),
    "~/code/study/topic",
  );
  assert.equal(
    abbreviateUserPath("/Volumes/study/topic", "/Users/example"),
    "/Volumes/study/topic",
  );
});

test("rejects a missing study-root argument", () => {
  assert.throws(
    () => requireStudyRoot("/harbor", ""),
    /Missing required argument: --study-root/,
  );
});

test("rejects a relative study root", () => {
  assert.throws(
    () => requireStudyRoot("/harbor", "../study"),
    /must be an absolute path/,
  );
});

test("rejects a study root inside Harbor", async () => {
  const harborRoot = await mkdtemp(
    path.join(os.tmpdir(), "harbor-study-config-"),
  );

  assert.throws(
    () => requireStudyRoot(harborRoot, path.join(harborRoot, "study")),
    /must be outside Harbor/,
  );
});

test("rejects a relative workspace that escapes the study root", async () => {
  const harborRoot = await mkdtemp(
    path.join(os.tmpdir(), "harbor-study-config-"),
  );

  await assert.rejects(
    resolveStudyWorkspaces(harborRoot, ["../other"], "/learning"),
    /must name a topic beneath --study-root/,
  );
});

test("accepts a supplied study environment when its root exists", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "harbor-study-config-"));
  const harborRoot = path.join(parent, "harbor");
  const studyRoot = path.join(parent, "study");
  await Promise.all([mkdir(harborRoot), mkdir(studyRoot)]);

  assert.equal(await checkStudyEnvironment(harborRoot, studyRoot), studyRoot);
});

test("rejects a supplied study root that does not exist", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "harbor-study-config-"));
  const harborRoot = path.join(parent, "harbor");
  await mkdir(harborRoot);

  await assert.rejects(
    checkStudyEnvironment(harborRoot, path.join(parent, "missing")),
    /does not exist; invoke \$setup-harbor/,
  );
});
