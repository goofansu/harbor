import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseEnv } from "node:util";

export async function resolveFirecrawlApiKey(
  root: string,
  environment: NodeJS.ProcessEnv = process.env,
): Promise<string | undefined> {
  const ambient = normalizeKey(environment.FIRECRAWL_API_KEY);
  if (ambient) {
    return ambient;
  }

  try {
    const values = parseEnv(await readFile(path.join(root, ".env"), "utf8"));
    return normalizeKey(values.FIRECRAWL_API_KEY);
  } catch (error) {
    if (isMissingFile(error)) {
      return undefined;
    }
    throw error;
  }
}

function normalizeKey(value: string | undefined): string | undefined {
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
