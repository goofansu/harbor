import path from "node:path";

import { atomicReplace, readUtf8 } from "./lib/files.js";
import {
  isRecord,
  parseMarkdownRecord,
  renderMarkdownRecord,
  requireGroup,
} from "./lib/markdown-record.js";
import { type Clock, currentTimestamp } from "./lib/time.js";

export interface ReviewExtraction {
  summary: string;
  concepts: string[];
  estimated_read_time?: string | null;
}

export interface ReviewScrapeResult {
  markdown: string;
  metadata: unknown;
  json: unknown;
}

export interface ReviewScraper {
  scrape(url: string): Promise<ReviewScrapeResult>;
}

export interface ReviewInput {
  root: string;
  itemPath: string;
  scraper: ReviewScraper;
  clock?: Clock;
}

export interface ReviewResult {
  extraction: ReviewExtraction;
  itemPath: string;
  stagedPath: string;
}

export const reviewJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    concepts: { type: "array", items: { type: "string" } },
    estimated_read_time: { type: ["string", "null"] },
  },
  required: ["summary", "concepts"],
} as const;

export async function reviewItem(input: ReviewInput): Promise<ReviewResult> {
  assertInboxItem(input.root, input.itemPath);
  const reviewedAt = (input.clock ?? currentTimestamp)();
  const parsed = parseMarkdownRecord(await readUtf8(input.itemPath));
  const source = requireGroup(parsed.data, "source");
  const sourceUrl = requireHttpUrl(source.url);
  const scraped = await input.scraper.scrape(sourceUrl);
  if (!scraped.markdown.trim()) {
    throw new Error("Firecrawl returned empty Markdown");
  }
  const extraction = parseExtraction(scraped.json);
  const metadata = parseSourceMetadata(scraped.metadata);
  const itemId = path.basename(input.itemPath, ".md");
  const stagedPath = path.join(
    input.root,
    ".cache",
    "firecrawl",
    `${itemId}.md`,
  );

  await atomicReplace(stagedPath, normalizeMarkdown(scraped.markdown));

  if (metadata.title) {
    source.title = metadata.title;
  }
  if (metadata.author) {
    source.author = metadata.author;
  }
  if (metadata.publishedAt) {
    source.published_at = metadata.publishedAt;
  }

  parsed.data.fetch = {
    provider: "firecrawl",
    fetched_at: reviewedAt,
    formats: ["json", "markdown"],
  };
  const analysis = requireGroup(parsed.data, "analysis");
  analysis.display_title = stringValue(source.title) ?? null;
  analysis.summary = extraction.summary;
  analysis.concepts = extraction.concepts;
  analysis.estimated_read_time = extraction.estimated_read_time ?? null;
  analysis.analyzed_at = reviewedAt;

  const routing = requireGroup(parsed.data, "routing");
  routing.article = {
    status: "staged",
    destination: relativePath(input.root, stagedPath),
    staged_at: reviewedAt,
    saved_at: null,
    failure_reason: null,
  };
  await atomicReplace(input.itemPath, renderMarkdownRecord(parsed));

  return { extraction, itemPath: input.itemPath, stagedPath };
}

function parseExtraction(value: unknown): ReviewExtraction {
  if (!isRecord(value)) {
    throw new Error("Firecrawl returned invalid structured review data");
  }
  const summary = stringValue(value.summary);
  if (!summary) {
    throw new Error("Firecrawl review data is missing summary");
  }
  if (
    !Array.isArray(value.concepts) ||
    !value.concepts.every((concept) => typeof concept === "string")
  ) {
    throw new Error("Firecrawl review data has invalid concepts");
  }
  return {
    summary,
    concepts: value.concepts,
    estimated_read_time: nullableString(value.estimated_read_time),
  };
}

function parseSourceMetadata(value: unknown): {
  title?: string;
  author?: string;
  publishedAt?: string;
} {
  if (!isRecord(value)) {
    return {};
  }
  const title = firstString(value, [
    "og:title",
    "ogTitle",
    "twitter:title",
    "title",
  ]);
  const author = firstString(value, ["article:author", "author"]);
  const publishedAt = firstString(value, [
    "article:published_time",
    "publishedTime",
    "published_at",
  ]);
  return {
    ...(title ? { title } : {}),
    ...(author ? { author } : {}),
    ...(publishedAt ? { publishedAt } : {}),
  };
}

function firstString(
  record: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = stringValue(record[key]);
    if (value) {
      return value;
    }
  }
  return undefined;
}

function assertInboxItem(root: string, itemPath: string): void {
  if (
    path.dirname(itemPath) !== path.join(root, "inbox") ||
    path.extname(itemPath) !== ".md"
  ) {
    throw new Error("Review item must be a Markdown file in inbox");
  }
}

function requireHttpUrl(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Review item is missing source URL");
  }
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Source URL must use http or https");
  }
  return url.href;
}

function normalizeMarkdown(markdown: string): string {
  return `${markdown.trim()}\n`;
}

function nullableString(value: unknown): string | null {
  return stringValue(value) ?? null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function relativePath(root: string, destination: string): string {
  return path.relative(root, destination).split(path.sep).join(path.posix.sep);
}
