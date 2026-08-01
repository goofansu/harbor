import {
  constants,
  link,
  mkdir,
  open,
  readFile,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";

export async function readUtf8(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

export async function atomicReplace(
  targetPath: string,
  contents: string,
): Promise<void> {
  const directory = path.dirname(targetPath);
  await mkdir(directory, { recursive: true });
  const tempPath = temporaryPath(targetPath);

  try {
    await durableWrite(tempPath, contents);
    await rename(tempPath, targetPath);
    await syncDirectory(directory);
  } finally {
    await unlink(tempPath).catch(ignoreMissing);
  }
}

export async function createExclusiveAtomic(
  targetPath: string,
  contents: string,
): Promise<void> {
  const directory = path.dirname(targetPath);
  await mkdir(directory, { recursive: true });
  const tempPath = temporaryPath(targetPath);

  try {
    await durableWrite(tempPath, contents);
    await link(tempPath, targetPath);
    await syncDirectory(directory);
  } finally {
    await unlink(tempPath).catch(ignoreMissing);
  }
}

export function isAlreadyExists(error: unknown): boolean {
  return isNodeError(error) && error.code === "EEXIST";
}

async function durableWrite(filePath: string, contents: string): Promise<void> {
  const handle = await open(
    filePath,
    constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
    0o644,
  );
  try {
    await handle.writeFile(contents, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function syncDirectory(directory: string): Promise<void> {
  const handle = await open(directory, constants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function temporaryPath(targetPath: string): string {
  return path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.${process.pid}.${crypto.randomUUID()}.tmp`,
  );
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function ignoreMissing(error: unknown): void {
  if (!isNodeError(error) || error.code !== "ENOENT") {
    throw error;
  }
}
