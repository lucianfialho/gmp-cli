import { google } from "googleapis";
import { filterPii } from "@lucianfialho/pii-filter";

const GA4_PII_FIELDS = [
  "user_pseudo_id",
  "user_id",
  "user_ltv",
  "event_params.email",
  "event_params.phone",
  "event_params.address",
  "user_properties.email",
  "user_properties.phone",
];

export function applyPrivacyFilter(rows: Record<string, string>[]): Record<string, string>[] {
  const salt = process.env.GMP_PII_SALT;
  const options = salt
    ? { mode: "pseudonymize" as const, salt, knownPiiFields: GA4_PII_FIELDS }
    : { mode: "redact" as const, knownPiiFields: GA4_PII_FIELDS };
  return rows.map((row) => filterPii(row, options) as Record<string, string>);
}

export function parseDateForBq(input: string): string {
  if (input === "today") {
    return new Date().toISOString().slice(0, 10).replace(/-/g, "");
  }
  if (input === "yesterday") {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10).replace(/-/g, "");
  }
  const match = input.match(/^(\d+)d$/);
  if (match) {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(match[1]!));
    return d.toISOString().slice(0, 10).replace(/-/g, "");
  }
  // Accept YYYY-MM-DD or YYYYMMDD
  return input.replace(/-/g, "");
}

export function parseDateRange(range: string): { start: string; end: string } {
  if (range.includes("..")) {
    const [s, e] = range.split("..");
    return { start: parseDateForBq(s!), end: parseDateForBq(e!) };
  }
  return { start: parseDateForBq(range), end: parseDateForBq("today") };
}

type Bigquery = ReturnType<typeof google.bigquery>;

export async function runBqQuery(
  bigquery: Bigquery,
  projectId: string,
  sql: string
): Promise<{ fields: string[]; rows: Record<string, string>[]; totalRows?: string }> {
  const first = await bigquery.jobs.query({
    projectId,
    requestBody: { query: sql, useLegacySql: false, maxResults: 10000 },
  });

  const fields = (first.data.schema?.fields || []).map((f) => f.name || "");
  const toRows = (cellRows: { f?: { v?: unknown }[] }[] | undefined): Record<string, string>[] =>
    (cellRows || []).map((row) => {
      const obj: Record<string, string> = {};
      (row.f || []).forEach((cell, i) => {
        obj[fields[i]!] = String(cell.v ?? "");
      });
      return obj;
    });

  const rows = toRows(first.data.rows);
  const jobId = first.data.jobReference?.jobId;
  const location = first.data.jobReference?.location ?? undefined;
  let pageToken = first.data.pageToken ?? undefined;

  while (pageToken && jobId) {
    const page = await bigquery.jobs.getQueryResults({ projectId, jobId, location, pageToken });
    rows.push(...toRows(page.data.rows));
    pageToken = page.data.pageToken ?? undefined;
  }

  return { fields, rows, totalRows: first.data.totalRows ?? undefined };
}
