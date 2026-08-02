import path from "node:path";

import Firecrawl from "firecrawl";

import { parseArgs, requireArg } from "./lib/args.js";
import { withFirecrawlSlot } from "./lib/firecrawl-concurrency.js";
import {
  reviewItem,
  reviewJsonSchema,
  type ReviewScraper,
} from "./review-core.js";

const root = process.cwd();

try {
  const args = parseArgs(process.argv.slice(2));
  const itemPath = resolveInboxPath(root, requireArg(args, "item"));
  const client = new Firecrawl();
  const scraper: ReviewScraper = {
    async scrape(url) {
      const document = await withFirecrawlSlot(root, () =>
        client.scrape(url, {
          formats: [
            "markdown",
            {
              type: "json",
              prompt:
                "Extract concise review analysis. Use page metadata for source facts.",
              schema: reviewJsonSchema,
            },
          ],
          onlyMainContent: true,
          removeBase64Images: true,
          storeInCache: true,
        }),
      );
      return {
        markdown: document.markdown ?? "",
        metadata: document.metadata,
        json: document.json,
      };
    },
  };
  const result = await reviewItem({ root, itemPath, scraper });
  process.stdout.write(`${JSON.stringify(result.extraction)}\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : "Review failed";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function resolveInboxPath(
  rootDirectory: string,
  requestedPath: string,
): string {
  const resolved = path.resolve(rootDirectory, requestedPath);
  if (
    path.dirname(resolved) !== path.join(rootDirectory, "inbox") ||
    path.extname(resolved) !== ".md"
  ) {
    throw new Error("Item path must be a Markdown file in inbox");
  }
  return resolved;
}
