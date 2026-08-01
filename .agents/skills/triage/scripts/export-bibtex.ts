import path from "node:path";

import { exportBibtexReference } from "./bibtex-core.js";
import { parseArgs, requireArg } from "./lib/args.js";

const root = process.cwd();

try {
  const args = parseArgs(process.argv.slice(2));
  const itemPath = resolveItemPath(root, requireArg(args, "item"));
  const bibliographyPath = path.resolve(root, requireArg(args, "bibliography"));
  const result = await exportBibtexReference({
    root,
    itemPath,
    bibliographyPath,
  });
  process.stdout.write(
    `${result.updated ? "Exported" : "Verified"} ${result.citationKey} in ${path.relative(root, bibliographyPath)}\n`,
  );
} catch {
  process.stderr.write(
    "BibTeX export failed; inspect the item routing state and bibliography\n",
  );
  process.exitCode = 1;
}

function resolveItemPath(rootDirectory: string, requestedPath: string): string {
  const resolved = path.resolve(rootDirectory, requestedPath);
  const referencesDirectory = path.join(rootDirectory, "resolved", "reference");
  const relative = path.relative(referencesDirectory, resolved);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    path.extname(resolved) !== ".md"
  ) {
    throw new Error("Item path must be a Markdown file in resolved/reference");
  }
  return resolved;
}
