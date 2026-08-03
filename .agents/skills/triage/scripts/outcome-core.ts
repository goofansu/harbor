import path from "node:path";

import { atomicReplace, readUtf8 } from "./lib/files.js";
import {
  isRecord,
  parseMarkdownRecord,
  renderMarkdownRecord,
  requireGroup,
} from "./lib/markdown-record.js";
import { type Clock, currentTimestamp } from "./lib/time.js";

export interface RecordOutcomeInput {
  root: string;
  itemPath: string;
  title: string;
  url: string;
  clock?: Clock;
}

export async function recordOutcome(input: RecordOutcomeInput): Promise<void> {
  assertResolvedItem(input.root, input.itemPath);
  const title = input.title.trim();
  if (!title) {
    throw new Error("Outcome title is required");
  }
  const url = requireHttpUrl(input.url);
  const parsed = parseMarkdownRecord(await readUtf8(input.itemPath));
  const resolution = requireGroup(parsed.data, "resolution");
  if (
    resolution.decision !== "read" &&
    resolution.decision !== "reference" &&
    resolution.decision !== "action" &&
    resolution.decision !== "discarded"
  ) {
    throw new Error("Outcomes require a terminally resolved item");
  }

  const outcomes = ensureOutcomesGroup(parsed.data);
  const items = outcomes.items;
  if (!Array.isArray(items)) {
    throw new Error("Expected outcomes.items to be an array");
  }
  items.push({
    kind: "publication",
    title,
    url,
    recorded_at: (input.clock ?? currentTimestamp)(),
  });
  await atomicReplace(input.itemPath, renderMarkdownRecord(parsed));
}

function ensureOutcomesGroup(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const existing = record.outcomes;
  if (isRecord(existing)) {
    return existing;
  }
  const created = { items: [] };
  record.outcomes = created;
  return created;
}

function assertResolvedItem(root: string, itemPath: string): void {
  const relative = path.relative(path.join(root, "resolved"), itemPath);
  const segments = relative.split(path.sep);
  const decisions = new Set(["read", "reference", "action", "discarded"]);
  if (
    segments.length !== 2 ||
    !segments[0] ||
    !decisions.has(segments[0]) ||
    path.extname(segments[1] ?? "") !== ".md"
  ) {
    throw new Error("Outcome item must be a Markdown file in resolved");
  }
}

function requireHttpUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Outcome URL must use http or https");
  }
  return url.href;
}
