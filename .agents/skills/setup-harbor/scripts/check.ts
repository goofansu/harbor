import { checkStudyEnvironment } from "../../use-harbor/scripts/lib/study-config.js";
import { parseArgs, requireArg } from "../../use-harbor/scripts/lib/args.js";

const root = process.cwd();

try {
  const args = parseArgs(process.argv.slice(2));
  const studyRoot = await checkStudyEnvironment(
    root,
    requireArg(args, "study-root"),
  );
  process.stdout.write(`Harbor environment ready: ${studyRoot}\n`);
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Harbor environment is invalid";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
