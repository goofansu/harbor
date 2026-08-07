import { mkdir, open, readFile, unlink } from "node:fs/promises";
import path from "node:path";

const DEFAULT_LIMIT = 2;
const DEFAULT_POLL_INTERVAL_MS = 100;

export async function withFirecrawlSlot<T>(
  root: string,
  operation: () => Promise<T>,
  options: { limit?: number; pollIntervalMs?: number } = {},
): Promise<T> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Firecrawl concurrency limit must be a positive integer");
  }
  const lockPath = await acquireSlot(root, limit, pollIntervalMs);
  try {
    return await operation();
  } finally {
    await unlink(lockPath).catch(ignoreMissing);
  }
}

async function acquireSlot(
  root: string,
  limit: number,
  pollIntervalMs: number,
): Promise<string> {
  const lockDirectory = path.join(root, ".cache", "firecrawl", "request-locks");
  await mkdir(lockDirectory, { recursive: true });

  while (true) {
    for (let slot = 1; slot <= limit; slot += 1) {
      const lockPath = path.join(lockDirectory, `slot-${slot}.lock`);
      try {
        const handle = await open(lockPath, "wx");
        try {
          await handle.writeFile(`${process.pid}\n`, "utf8");
        } finally {
          await handle.close();
        }
        return lockPath;
      } catch (error) {
        if (!isAlreadyExists(error)) {
          throw error;
        }
        await removeStaleLock(lockPath);
      }
    }
    await delay(pollIntervalMs);
  }
}

async function removeStaleLock(lockPath: string): Promise<void> {
  const contents = await readFile(lockPath, "utf8").catch(() => "");
  const pid = Number.parseInt(contents.trim(), 10);
  if (!Number.isInteger(pid) || pid < 1 || processIsRunning(pid)) {
    return;
  }
  await unlink(lockPath).catch(ignoreMissing);
}

function processIsRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return isNodeError(error) && error.code !== "ESRCH";
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isAlreadyExists(error: unknown): boolean {
  return isNodeError(error) && error.code === "EEXIST";
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function ignoreMissing(error: unknown): void {
  if (!isNodeError(error) || error.code !== "ENOENT") {
    throw error;
  }
}
