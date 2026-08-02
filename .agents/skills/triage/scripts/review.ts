import path from "node:path";

import Firecrawl from "firecrawl";

import { parseArgs, requireArg } from "./lib/args.js";
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
      const document = await client.scrape(url, {
        formats: [
          "markdown",
          {
            type: "json",
            prompt:
              "Extract source facts and concise review inputs. Do not infer unavailable source facts.",
            schema: reviewJsonSchema,
          },
        ],
        onlyMainContent: true,
        removeBase64Images: true,
        storeInCache: true,
      });
      return { markdown: document.markdown ?? "", json: document.json };
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
