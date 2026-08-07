import { parse, stringify } from "yaml";

export type HarborRecord = Record<string, unknown>;

export interface MarkdownRecord {
  data: HarborRecord;
  body: string;
}

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export function parseMarkdownRecord(contents: string): MarkdownRecord {
  const match = contents.match(frontmatterPattern);
  if (!match?.[1]) {
    throw new Error("Markdown record is missing YAML frontmatter");
  }

  const parsed: unknown = parse(match[1]);
  if (!isRecord(parsed)) {
    throw new Error("Markdown frontmatter must be a YAML mapping");
  }

  return {
    data: parsed,
    body: contents.slice(match[0].length),
  };
}

export function renderMarkdownRecord(record: MarkdownRecord): string {
  const yaml = stringify(record.data, {
    lineWidth: 0,
    nullStr: "",
  }).trimEnd();
  const body = record.body.length === 0 ? "" : `\n${record.body}`;

  return `---\n${yaml}\n---\n${body}`;
}

export function isRecord(value: unknown): value is HarborRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function requireGroup(record: HarborRecord, key: string): HarborRecord {
  const group = record[key];
  if (!isRecord(group)) {
    throw new Error(`Expected frontmatter group: ${key}`);
  }

  return group;
}

export function optionalString(
  record: HarborRecord,
  key: string,
): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
