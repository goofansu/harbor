import path from "node:path";

import { configureHarbor } from "./configure-core.js";

const root = process.cwd();

try {
  const studyRoot = requiredValue(process.argv.slice(2), "--study-root");
  await configureHarbor({ harborRoot: root, studyRoot });
  process.stdout.write(
    `Configured Harbor study root at ${path.normalize(studyRoot)}\n`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : "Setup failed";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function requiredValue(argv: string[], flag: string): string {
  const index = argv.indexOf(flag);
  const value = index >= 0 ? argv[index + 1] : undefined;
  if (!value) {
    throw new Error(`Missing required argument: ${flag}`);
  }
  return value;
}
