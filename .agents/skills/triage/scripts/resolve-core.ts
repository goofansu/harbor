import { mkdir, rename, unlink } from "node:fs/promises";
import path from "node:path";

import { citationKeyForItem } from "./bibtex-core.js";
import { atomicReplace, readUtf8 } from "./lib/files.js";
import {
  parseMarkdownRecord,
  renderMarkdownRecord,
  requireGroup,
} from "./lib/markdown-record.js";
import { type Clock, currentTimestamp } from "./lib/time.js";

export type TerminalDecision = "read" | "reference" | "action" | "discarded";

export interface ResolveInput {
  root: string;
  itemPath: string;
  decision: TerminalDecision;
  reason: string;
  decidedBy?: string;
  clock?: Clock;
}

export interface ResolveResult {
  itemPath: string;
  savedArticlePath?: string;
}

export async function resolveItem(input: ResolveInput): Promise<ResolveResult> {
  assertInboxItem(input.root, input.itemPath);
  if (!input.reason.trim()) {
    throw new Error("A concrete resolution reason is required");
  }
  const resolvedAt = (input.clock ?? currentTimestamp)();
  const parsed = parseMarkdownRecord(await readUtf8(input.itemPath));
  const routing = requireGroup(parsed.data, "routing");
  const itemId = path.basename(input.itemPath, ".md");
  let savedArticlePath: string | undefined;

  if (input.decision === "read") {
    const article = requireGroup(routing, "article");
    if (
      article.status !== "staged" ||
      typeof article.destination !== "string"
    ) {
      throw new Error("A read decision requires staged review Markdown");
    }
    const stagedPath = expectedStagedPath(input.root, itemId);
    if (article.destination !== relativePath(input.root, stagedPath)) {
      throw new Error("Article staging path does not match the review item");
    }
    const markdown = await readUtf8(stagedPath);
    savedArticlePath = path.join(
      input.root,
      "saves",
      `${citationKeyForItem(itemId)}.md`,
    );
    await atomicReplace(savedArticlePath, markdown);
    article.status = "complete";
    article.destination = relativePath(input.root, savedArticlePath);
    article.saved_at = resolvedAt;
    article.failure_reason = null;
  } else {
    const article = requireGroup(routing, "article");
    if (
      article.status === "staged" &&
      typeof article.destination === "string"
    ) {
      const stagedPath = expectedStagedPath(input.root, itemId);
      if (article.destination !== relativePath(input.root, stagedPath)) {
        throw new Error("Article staging path does not match the review item");
      }
      await unlink(stagedPath).catch(ignoreMissing);
    }
    routing.article = {
      status: "not_applicable",
      destination: null,
      staged_at: null,
      saved_at: null,
      failure_reason: null,
    };
  }

  const resolution = requireGroup(parsed.data, "resolution");
  resolution.decision = input.decision;
  resolution.decided_by = input.decidedBy ?? "user";
  resolution.reason = input.reason.trim();
  resolution.resolved_at = resolvedAt;

  const maintenance = requireGroup(parsed.data, "maintenance");
  maintenance.policy =
    input.decision === "reference" ? "on_related_item" : "none";
  maintenance.state = input.decision === "reference" ? "current" : null;
  maintenance.last_reviewed_at =
    input.decision === "reference" ? resolvedAt : null;
  maintenance.review_after = null;

  const destination = path.join(
    input.root,
    "resolved",
    input.decision,
    path.basename(input.itemPath),
  );
  await atomicReplace(input.itemPath, renderMarkdownRecord(parsed));
  await mkdir(path.dirname(destination), { recursive: true });
  await rename(input.itemPath, destination);

  if (input.decision === "read") {
    const article = requireGroup(routing, "article");
    if (typeof article.staged_at === "string") {
      const stagedPath = expectedStagedPath(input.root, itemId);
      await unlink(stagedPath).catch(ignoreMissing);
    }
  }

  return {
    itemPath: destination,
    ...(savedArticlePath ? { savedArticlePath } : {}),
  };
}

function assertInboxItem(root: string, itemPath: string): void {
  if (
    path.dirname(itemPath) !== path.join(root, "inbox") ||
    path.extname(itemPath) !== ".md"
  ) {
    throw new Error("Resolution item must be a Markdown file in inbox");
  }
}

function expectedStagedPath(root: string, itemId: string): string {
  return path.join(root, ".cache", "firecrawl", `${itemId}.md`);
}

function relativePath(root: string, destination: string): string {
  return path.relative(root, destination).split(path.sep).join(path.posix.sep);
}

function ignoreMissing(error: unknown): void {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
}
