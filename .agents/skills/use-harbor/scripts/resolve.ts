import path from "node:path";

import { argValues, parseArgs, requireArg } from "./lib/args.js";
import { resolveStudyWorkspaces } from "./lib/study-config.js";
import { resolveItem, type TerminalDecision } from "./resolve-core.js";

const decisions = new Set<TerminalDecision>(["study", "discard"]);
const root = process.cwd();

try {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const requestedDecision = requireArg(args, "decision");
  if (!decisions.has(requestedDecision as TerminalDecision)) {
    throw new Error("Decision must be study or discard");
  }
  const studyWorkspaces = await resolveStudyWorkspaces(
    root,
    argValues(argv, "study-workspace"),
    requireArg(args, "study-root"),
  );
  const result = await resolveItem({
    root,
    itemPath: resolveInboxPath(root, requireArg(args, "item")),
    decision: requestedDecision as TerminalDecision,
    reason: requireArg(args, "reason"),
    decidedBy: args.get("decided-by") ?? "user",
    ...(studyWorkspaces.length > 0 ? { studyWorkspaces } : {}),
  });
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
