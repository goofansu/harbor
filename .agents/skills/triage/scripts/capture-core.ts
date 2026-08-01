import path from "node:path";

import { createExclusiveAtomic, isAlreadyExists } from "./lib/files.js";
import { renderMarkdownRecord } from "./lib/markdown-record.js";
import { slugFromUrl, slugify } from "./lib/slug.js";
import {
  type Clock,
  currentTimestamp,
  timestampForFilename,
} from "./lib/time.js";

export interface CaptureInput {
  root: string;
  url: string;
  title?: string;
  notes?: string;
  savedBy?: string;
  clock?: Clock;
}

export interface CaptureResult {
  itemPath: string;
  relativePath: string;
}

export async function capture(input: CaptureInput): Promise<CaptureResult> {
  const sourceUrl = parseSourceUrl(input.url);
  const savedAt = (input.clock ?? currentTimestamp)();
  const slug = input.title ? slugify(input.title) : slugFromUrl(sourceUrl);
  const baseName = `${timestampForFilename(savedAt)}-${slug}`;
  const body = input.notes ? `## Capture notes\n\n${input.notes.trim()}\n` : "";
  const contents = renderMarkdownRecord({
    data: {
      source: {
        url: sourceUrl.href,
        title: input.title || null,
        author: null,
        published_at: null,
      },
      capture: {
        saved_at: savedAt,
        saved_by: input.savedBy ?? "user",
      },
      fetch: {
        provider: null,
        fetched_at: null,
        formats: [],
      },
      analysis: {
        display_title: null,
        summary: null,
        concepts: [],
        estimated_read_time: null,
        novelty: null,
        novelty_reason: null,
        related_items: [],
        analyzed_at: null,
      },
      resolution: {
        recommendation: null,
        decision: null,
        decided_by: null,
        reason: null,
        resolved_at: null,
      },
      maintenance: {
        policy: null,
        state: null,
        last_reviewed_at: null,
        review_after: null,
      },
      routing: {
        bibliography: {
          status: "not_applicable",
          destination: null,
          citation_key: null,
          routed_at: null,
          failure_reason: null,
        },
      },
    },
    body,
  });

  for (let suffix = 1; ; suffix += 1) {
    const filename = `${baseName}${suffix === 1 ? "" : `-${suffix}`}.md`;
    const itemPath = path.join(input.root, "inbox", filename);
    try {
      await createExclusiveAtomic(itemPath, contents);
      return {
        itemPath,
        relativePath: path.posix.join("inbox", filename),
      };
    } catch (error) {
      if (!isAlreadyExists(error)) {
        throw error;
      }
    }
  }
}

function parseSourceUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Source URL must use http or https");
  }
  return url;
}
