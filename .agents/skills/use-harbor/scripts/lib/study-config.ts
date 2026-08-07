import { stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function resolveStudyWorkspaces(
  harborRoot: string,
  requestedWorkspaces: string[],
  studyRoot: string,
): Promise<string[]> {
  const validatedRoot = requireStudyRoot(harborRoot, studyRoot);
  const workspaces = requestedWorkspaces
    .map(normalize)
    .filter((requested): requested is string => Boolean(requested))
    .map((requested) => {
      if (path.isAbsolute(requested)) {
        return requireOutsideHarbor(harborRoot, path.normalize(requested));
      }

      const workspace = path.resolve(validatedRoot, requested);
      const relative = path.relative(validatedRoot, workspace);
      if (
        !relative ||
        relative.startsWith(`..${path.sep}`) ||
        relative === ".." ||
        path.isAbsolute(relative)
      ) {
        throw new Error(
          "A relative --study-workspace must name a topic beneath --study-root",
        );
      }
      return workspace;
    });
  return [...new Set(workspaces)];
}

export function abbreviateUserPath(
  value: string,
  homeDirectory = os.homedir(),
): string {
  const normalized = path.resolve(value);
  const relative = path.relative(path.resolve(homeDirectory), normalized);
  if (relative === "") {
    return "~";
  }
  if (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  ) {
    return `~/${relative.split(path.sep).join("/")}`;
  }
  return normalized;
}

export async function checkStudyEnvironment(
  harborRoot: string,
  studyRoot: string,
): Promise<string> {
  const validatedRoot = requireStudyRoot(harborRoot, studyRoot);
  try {
    const information = await stat(validatedRoot);
    if (!information.isDirectory()) {
      throw new Error("Study root is not a directory; invoke $setup-harbor");
    }
  } catch (error) {
    if (isMissingFile(error)) {
      throw new Error("Study root does not exist; invoke $setup-harbor");
    }
    throw error;
  }
  return validatedRoot;
}

export function requireStudyRoot(
  harborRoot: string,
  studyRoot: string,
): string {
  const normalized = normalize(studyRoot);
  if (!normalized) {
    throw new Error(
      "Missing required argument: --study-root; invoke $setup-harbor",
    );
  }
  if (!path.isAbsolute(normalized)) {
    throw new Error("--study-root must be an absolute path");
  }
  return requireOutsideHarbor(harborRoot, path.normalize(normalized));
}

function requireOutsideHarbor(harborRoot: string, value: string): string {
  const normalizedHarborRoot = path.resolve(harborRoot);
  const normalizedValue = path.resolve(value);
  const relative = path.relative(normalizedHarborRoot, normalizedValue);
  if (
    !relative ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  ) {
    throw new Error("The study workspace must be outside Harbor");
  }
  return normalizedValue;
}

function normalize(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function isMissingFile(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}
