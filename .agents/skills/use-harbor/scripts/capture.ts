import path from "node:path";

import { capture } from "./capture-core.js";
import { parseArgs, requireArg } from "./lib/args.js";

try {
  const args = parseArgs(process.argv.slice(2));
  const title = args.get("title");
  const notes = args.get("notes");
  const savedBy = args.get("saved-by");
  const result = await capture({
    root: process.cwd(),
    url: requireArg(args, "url"),
    ...(title ? { title } : {}),
    ...(notes ? { notes } : {}),
    ...(savedBy ? { savedBy } : {}),
  });
  process.stdout.write(
    `Captured ${path.relative(process.cwd(), result.itemPath)}\n`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : "Capture failed";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
