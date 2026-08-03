import path from "node:path";

import { parseArgs, requireArg } from "./lib/args.js";
import { recordOutcome } from "./outcome-core.js";

const root = process.cwd();

try {
  const args = parseArgs(process.argv.slice(2));
  const itemPath = resolveItemPath(root, requireArg(args, "item"));
  await recordOutcome({
    root,
    itemPath,
    title: requireArg(args, "title"),
    url: requireArg(args, "url"),
  });
  process.stdout.write(
    `Recorded outcome in ${path.relative(root, itemPath)}\n`,
  );
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Outcome recording failed";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function resolveItemPath(rootDirectory: string, requestedPath: string): string {
  return path.resolve(rootDirectory, requestedPath);
}
