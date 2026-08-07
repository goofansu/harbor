import { mkdir } from "node:fs/promises";
import path from "node:path";

export interface ConfigureHarborInput {
  harborRoot: string;
  studyRoot: string;
}

export async function configureHarbor(
  input: ConfigureHarborInput,
): Promise<void> {
  const harborRoot = path.resolve(input.harborRoot);
  const studyRoot = requireExternalAbsolutePath(harborRoot, input.studyRoot);

  await mkdir(studyRoot, { recursive: true });
}

function requireExternalAbsolutePath(
  harborRoot: string,
  value: string,
): string {
  if (!path.isAbsolute(value)) {
    throw new Error("Study root must be an absolute path");
  }
  const studyRoot = path.normalize(value);
  const relative = path.relative(harborRoot, studyRoot);
  if (
    !relative ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  ) {
    throw new Error("Study root must be outside Harbor");
  }
  return studyRoot;
}
