import path from "node:path";

import { exportBibtexEntry } from "./bibtex-core.js";
import { parseArgs, requireArg } from "./lib/args.js";
import { resolveStudyWorkspace } from "./lib/study-config.js";
import { resolveItem, type TerminalDecision } from "./resolve-core.js";

const decisions = new Set<TerminalDecision>(["study", "discard"]);
const root = process.cwd();

try {
  const args = parseArgs(process.argv.slice(2));
  const requestedDecision = requireArg(args, "decision");
  if (!decisions.has(requestedDecision as TerminalDecision)) {
    throw new Error("Decision must be study or discard");
  }
  const studyWorkspace = await resolveStudyWorkspace(
    root,
    args.get("study-workspace"),
    requireArg(args, "study-root"),
  );
  const result = await resolveItem({
    root,
    itemPath: resolveInboxPath(root, requireArg(args, "item")),
    decision: requestedDecision as TerminalDecision,
    reason: requireArg(args, "reason"),
    decidedBy: args.get("decided-by") ?? "user",
    ...(studyWorkspace ? { studyWorkspace } : {}),
  });
  if (requestedDecision === "study") {
    await exportBibtexEntry({
      root,
      itemPath: result.itemPath,
      bibliographyPath: path.join(root, "reference.bib"),
    });
  }
  process.stdout.write(`Resolved ${path.relative(root, result.itemPath)}\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : "Resolution failed";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function resolveInboxPath(
  rootDirectory: string,
  requestedPath: string,
): string {
  const resolved = path.resolve(rootDirectory, requestedPath);
  if (
    path.dirname(resolved) !== path.join(rootDirectory, "inbox") ||
    path.extname(resolved) !== ".md"
  ) {
    throw new Error("Item path must be a Markdown file in inbox");
  }
  return resolved;
}
