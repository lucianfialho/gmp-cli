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

export function toISODate(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

function resolveToDate(input: string): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (input === "today") return today;
  if (input === "yesterday") {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d;
  }
  const match = input.match(/^(\d+)d$/);
  if (match) {
    const d = new Date(today);
    d.setDate(d.getDate() - parseInt(match[1]!));
    return d;
  }
  return new Date(`${input}T00:00:00`);
}

export function resolveConcreteDateRange(range: string): { start: Date; end: Date } {
  if (range.includes("..")) {
    const [s, e] = range.split("..");
    return { start: resolveToDate(s!), end: resolveToDate(e!) };
  }
  return { start: resolveToDate(range), end: resolveToDate("today") };
}

export type CompareMode = "previous_period" | "previous_year";

export function computeCompareRange(
  current: { start: Date; end: Date },
  mode: CompareMode
): { startDate: string; endDate: string } {
  if (mode === "previous_year") {
    const start = new Date(current.start);
    start.setFullYear(start.getFullYear() - 1);
    const end = new Date(current.end);
    end.setFullYear(end.getFullYear() - 1);
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }

  // previous_period: same length, ending the day before the current period starts
  const durationMs = current.end.getTime() - current.start.getTime();
  const end = new Date(current.start.getTime() - 24 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - durationMs);
  return { startDate: toISODate(start), endDate: toISODate(end) };
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
