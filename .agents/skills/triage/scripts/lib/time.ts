export type Clock = () => string;

export const currentTimestamp: Clock = () => {
  const date = new Date();
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const minutes = String(absoluteOffset % 60).padStart(2, "0");
  const local = new Date(date.getTime() + offsetMinutes * 60_000)
    .toISOString()
    .slice(0, 19);

  return `${local}${sign}${hours}:${minutes}`;
};

export function timestampForFilename(timestamp: string): string {
  const match = timestamp.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
  );
  if (!match) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }

  return match.slice(1).join("");
}
