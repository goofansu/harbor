import { mkdir, rename } from "node:fs/promises";
import path from "node:path";

import { atomicReplace, readUtf8 } from "./lib/files.js";
import {
  parseMarkdownRecord,
  renderMarkdownRecord,
  requireGroup,
} from "./lib/markdown-record.js";
import { abbreviateUserPath } from "./lib/study-config.js";
import { type Clock, currentTimestamp } from "./lib/time.js";

export type TerminalDecision = "study" | "discard";

export interface ResolveInput {
  root: string;
  itemPath: string;
  decision: TerminalDecision;
  reason: string;
  decidedBy?: string;
  studyWorkspaces?: string[];
  clock?: Clock;
}

export interface ResolveResult {
  itemPath: string;
}

export async function resolveItem(input: ResolveInput): Promise<ResolveResult> {
  assertInboxItem(input.root, input.itemPath);
  if (!input.reason.trim()) {
    throw new Error("A concrete resolution reason is required");
  }
  const resolvedAt = (input.clock ?? currentTimestamp)();
  const parsed = parseMarkdownRecord(await readUtf8(input.itemPath));
  const routing = requireGroup(parsed.data, "routing");

  if (input.decision === "study") {
    const destinations = (input.studyWorkspaces ?? []).map((workspace) =>
      abbreviateUserPath(workspace),
    );
    routing.study =
      destinations.length > 0
        ? {
            status: "complete",
            destinations,
            routed_at: resolvedAt,
            failure_reason: null,
          }
        : {
            status: "pending",
            destinations: [],
            routed_at: null,
            failure_reason: null,
          };
  } else {
    routing.study = {
      status: "not_applicable",
      destinations: [],
      routed_at: null,
      failure_reason: null,
    };
  }
  delete routing.article;
  delete routing.bibliography;

  const resolution = requireGroup(parsed.data, "resolution");
  resolution.decision = input.decision;
  resolution.decided_by = input.decidedBy ?? "user";
  resolution.reason = input.reason.trim();
  resolution.resolved_at = resolvedAt;

  delete parsed.data.maintenance;

  const destination = path.join(
    input.root,
    "resolved",
    input.decision,
    path.basename(input.itemPath),
  );
  await atomicReplace(input.itemPath, renderMarkdownRecord(parsed));
  await mkdir(path.dirname(destination), { recursive: true });
  await rename(input.itemPath, destination);

  return { itemPath: destination };
}

function assertInboxItem(root: string, itemPath: string): void {
  if (
    path.dirname(itemPath) !== path.join(root, "inbox") ||
    path.extname(itemPath) !== ".md"
  ) {
    throw new Error("Resolution item must be a Markdown file in inbox");
  }
}
