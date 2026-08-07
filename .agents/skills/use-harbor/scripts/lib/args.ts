export function parseArgs(argv: string[]): Map<string, string> {
  const values = new Map<string, string>();
  for (const [flag, value] of argumentPairs(argv)) {
    values.set(flag.slice(2), value);
  }
  return values;
}

export function argValues(argv: string[], name: string): string[] {
  return argumentPairs(argv)
    .filter(([flag]) => flag === `--${name}`)
    .map(([, value]) => value);
}

export function requireArg(args: Map<string, string>, name: string): string {
  const value = args.get(name);
  if (!value) {
    throw new Error(`Missing required argument: --${name}`);
  }
  return value;
}

function argumentPairs(argv: string[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith("--") || value === undefined) {
      throw new Error("Arguments must be provided as --name value pairs");
    }
    pairs.push([flag, value]);
  }
  return pairs;
}
