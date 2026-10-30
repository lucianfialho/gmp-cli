import { analyticsdata_v1beta } from "googleapis";

type Row = analyticsdata_v1beta.Schema$Row;

export function parseDate(input: string): string {
  if (input === "today") return "today";
  if (input === "yesterday") return "yesterday";
  const match = input.match(/^(\d+)d$/);
  if (match) return `${match[1]}daysAgo`;
  return input;
}

export function parseDateRange(range: string): { startDate: string; endDate: string } {
  if (range.includes("..")) {
    const [start, end] = range.split("..");
    return { startDate: parseDate(start!), endDate: parseDate(end!) };
  }
  return { startDate: parseDate(range), endDate: "today" };
}

export function rowsToObjects(
  rows: Row[],
  dimHeaders: string[],
  metricHeaders: string[]
): Record<string, string>[] {
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    (row.dimensionValues || []).forEach((v, i) => {
      obj[dimHeaders[i]!] = v.value || "";
    });
    (row.metricValues || []).forEach((v, i) => {
      obj[metricHeaders[i]!] = v.value || "";
    });
    return obj;
  });
}
