import path from "node:path";

import { atomicReplace, readUtf8 } from "./lib/files.js";
import {
  optionalString,
  parseMarkdownRecord,
  renderMarkdownRecord,
  requireGroup,
} from "./lib/markdown-record.js";
import { type Clock, currentTimestamp } from "./lib/time.js";

export interface ExportBibtexInput {
  root: string;
  itemPath: string;
  bibliographyPath: string;
  clock?: Clock;
}

export interface ExportBibtexResult {
  bibliographyPath: string;
  citationKey: string;
  itemId: string;
  updated: boolean;
}

export async function exportBibtexReference(
  input: ExportBibtexInput,
): Promise<ExportBibtexResult> {
  const clock = input.clock ?? currentTimestamp;
  const parsed = parseMarkdownRecord(await readUtf8(input.itemPath));
  const resolution = requireGroup(parsed.data, "resolution");
  if (resolution.decision !== "read" && resolution.decision !== "reference") {
    throw new Error("Only items resolved as read or reference can be exported");
  }

  const source = requireGroup(parsed.data, "source");
  const sourceUrl = requireString(source, "url");
  const title =
    optionalString(source, "title") ??
    optionalString(requireGroup(parsed.data, "analysis"), "display_title");
  if (!title) {
    throw new Error("A source title is required for BibTeX export");
  }

  const itemId = path.basename(input.itemPath, path.extname(input.itemPath));
  const citationKey = citationKeyForItem(itemId);
  const author = optionalString(source, "author");
  const publishedAt = normalizeDate(optionalString(source, "published_at"));
  const accessedAt = normalizeDate(
    optionalString(requireGroup(parsed.data, "fetch"), "fetched_at") ??
      optionalString(requireGroup(parsed.data, "capture"), "saved_at") ??
      optionalString(resolution, "resolved_at"),
  );
  if (!accessedAt) {
    throw new Error("A source access date is required for BibTeX export");
  }
  const articleDestination =
    resolution.decision === "read"
      ? optionalCompletedArticleDestination(parsed.data)
      : undefined;

  const generated = renderManagedEntry({
    itemId,
    citationKey,
    title,
    sourceUrl,
    ...(author ? { author } : {}),
    ...(publishedAt ? { publishedAt } : {}),
    ...(articleDestination ? { file: articleDestination } : {}),
    accessedAt,
  });
  const existing = await readUtf8(input.bibliographyPath).catch(
    (error: unknown) => {
      if (isNodeError(error) && error.code === "ENOENT") {
        return "";
      }
      throw error;
    },
  );
  const next = upsertManagedEntry(existing, itemId, generated);
  const updated = next !== existing;

  try {
    if (updated) {
      await atomicReplace(input.bibliographyPath, next);
    }
    const latest = parseMarkdownRecord(await readUtf8(input.itemPath));
    const routing = ensureRecord(latest.data, "routing");
    const destination = relativeDestination(input.root, input.bibliographyPath);
    if (
      !updated &&
      routingIsComplete(routing.bibliography, destination, citationKey)
    ) {
      return {
        bibliographyPath: input.bibliographyPath,
        citationKey,
        itemId,
        updated,
      };
    }
    routing.bibliography = {
      status: "complete",
      destination,
      citation_key: citationKey,
      routed_at: clock(),
      failure_reason: null,
    };
    await atomicReplace(input.itemPath, renderMarkdownRecord(latest));
  } catch (error) {
    await recordRoutingFailure(input.itemPath, clock()).catch(() => undefined);
    throw error;
  }

  return {
    bibliographyPath: input.bibliographyPath,
    citationKey,
    itemId,
    updated,
  };
}

export function citationKeyForItem(itemId: string): string {
  const normalized = itemId.replace(/[^A-Za-z0-9]/g, "");
  if (!normalized) {
    throw new Error("Cannot derive a citation key from the item filename");
  }
  return `harbor${normalized}`;
}

export function renderManagedEntry(input: {
  itemId: string;
  citationKey: string;
  title: string;
  sourceUrl: string;
  author?: string;
  publishedAt?: string;
  file?: string;
  accessedAt: string;
}): string {
  const fields = [
    ...(input.author ? [`  author = {${escapeBibtexText(input.author)}}`] : []),
    `  title = {${escapeBibtexText(input.title)}}`,
    ...(input.publishedAt ? [`  date = {${input.publishedAt}}`] : []),
    `  url = {${input.sourceUrl}}`,
    ...(input.file ? [`  file = {${escapeBibtexText(input.file)}}`] : []),
    `  urldate = {${input.accessedAt}}`,
  ];

  return [
    `% harbor-begin: ${input.itemId}`,
    `@online{${input.citationKey},`,
    fields.join(",\n"),
    "}",
    `% harbor-end: ${input.itemId}`,
    "",
  ].join("\n");
}

function optionalCompletedArticleDestination(
  record: Record<string, unknown>,
): string | undefined {
  const routing = requireGroup(record, "routing");
  const article = routing.article;
  if (!isRecord(article)) {
    return undefined;
  }
  if (article.status !== "complete") {
    throw new Error("A read must have a saved article before BibTeX export");
  }
  return requireString(article, "destination");
}

export function upsertManagedEntry(
  bibliography: string,
  itemId: string,
  generated: string,
): string {
  const startMarker = `% harbor-begin: ${itemId}`;
  const endMarker = `% harbor-end: ${itemId}`;
  const start = bibliography.indexOf(startMarker);
  const end = bibliography.indexOf(endMarker);

  if ((start === -1) !== (end === -1) || (start !== -1 && end < start)) {
    throw new Error(`Malformed Harbor BibTeX block for ${itemId}`);
  }

  if (start !== -1) {
    const afterEnd = end + endMarker.length;
    const blockEnd =
      bibliography.slice(afterEnd, afterEnd + 2) === "\r\n"
        ? afterEnd + 2
        : bibliography[afterEnd] === "\n"
          ? afterEnd + 1
          : afterEnd;
    return `${bibliography.slice(0, start)}${generated}${bibliography.slice(blockEnd)}`;
  }

  if (bibliography.length === 0) {
    return generated;
  }
  const separator = bibliography.endsWith("\n\n")
    ? ""
    : bibliography.endsWith("\n")
      ? "\n"
      : "\n\n";
  return `${bibliography}${separator}${generated}`;
}

function escapeBibtexText(value: string): string {
  const replacements: Record<string, string> = {
    "\\": "\\textbackslash{}",
    "{": "\\{",
    "}": "\\}",
    "%": "\\%",
    "&": "\\&",
    "#": "\\#",
    _: "\\_",
    $: "\\$",
  };
  return [...value]
    .map((character) => replacements[character] ?? character)
    .join("");
}

function normalizeDate(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match?.[1];
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = optionalString(record, key);
  if (!value) {
    throw new Error(`Expected non-empty field: ${key}`);
  }
  return value;
}

function ensureRecord(
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const existing = record[key];
  if (isRecord(existing)) {
    return existing;
  }
  const created: Record<string, unknown> = {};
  record[key] = created;
  return created;
}

async function recordRoutingFailure(
  itemPath: string,
  routedAt: string,
): Promise<void> {
  const latest = parseMarkdownRecord(await readUtf8(itemPath));
  const routing = ensureRecord(latest.data, "routing");
  routing.bibliography = {
    status: "failed",
    destination: null,
    citation_key: null,
    routed_at: routedAt,
    failure_reason: "bibliography_error",
  };
  await atomicReplace(itemPath, renderMarkdownRecord(latest));
}

function relativeDestination(root: string, destination: string): string {
  return path.relative(root, destination).split(path.sep).join(path.posix.sep);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function routingIsComplete(
  value: unknown,
  destination: string,
  citationKey: string,
): boolean {
  return (
    isRecord(value) &&
    value.status === "complete" &&
    value.destination === destination &&
    value.citation_key === citationKey
  );
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
