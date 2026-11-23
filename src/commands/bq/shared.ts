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

export interface BqCostOptions {
  /** Só valida a query e estima o custo; não executa nem cobra. */
  dryRun?: boolean;
  /** Teto de bytes faturáveis; a query falha sem cobrar se passar disso. */
  maxBytes?: number;
}

export interface BqQueryResult {
  fields: string[];
  rows: Record<string, string>[];
  totalRows?: string;
  /** Bytes que a query processa (dry-run: estimativa; senão: o que foi lido). */
  bytesProcessed?: number;
  cacheHit?: boolean;
}

/** Converte `--max-bytes` em inteiro positivo; aceita sufixos KB/MB/GB/TB (base 1024). */
export function parseMaxBytes(input: string): number {
  const m = /^\s*(\d+(?:\.\d+)?)\s*(b|kb|mb|gb|tb)?\s*$/i.exec(input);
  if (!m) throw new Error(`Invalid --max-bytes: "${input}" (use e.g. 500000000, 500MB, 1GB)`);
  const unit = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 }[(m[2] ?? "b").toLowerCase() as "b"];
  const bytes = Math.floor(Number(m[1]) * unit);
  if (!Number.isSafeInteger(bytes) || bytes <= 0) throw new Error(`Invalid --max-bytes: "${input}"`);
  return bytes;
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${i === 0 ? v : v.toFixed(2)} ${units[i]}`;
}

export async function runBqQuery(
  bigquery: Bigquery,
  projectId: string,
  sql: string,
  cost: BqCostOptions = {}
): Promise<BqQueryResult> {
  const first = await bigquery.jobs.query({
    projectId,
    requestBody: {
      query: sql,
      useLegacySql: false,
      maxResults: 10000,
      ...(cost.dryRun ? { dryRun: true } : {}),
      // int64 na API do BigQuery é string.
      ...(cost.maxBytes ? { maximumBytesBilled: String(cost.maxBytes) } : {}),
    },
  });

  const bytesRaw = first.data.totalBytesProcessed;
  const bytesProcessed = bytesRaw != null ? Number(bytesRaw) : undefined;
  const cacheHit = first.data.cacheHit ?? undefined;

  if (cost.dryRun) {
    return { fields: [], rows: [], bytesProcessed, cacheHit };
  }

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

  return { fields, rows, totalRows: first.data.totalRows ?? undefined, bytesProcessed, cacheHit };
}

/** Linha de custo para stderr (stdout fica só com o resultado, parseável). */
export function costSummary(r: BqQueryResult, opts: BqCostOptions): string | undefined {
  if (r.bytesProcessed == null) return undefined;
  const prefix = opts.dryRun ? "# dry-run: would process" : "# processed";
  const cache = r.cacheHit ? " (cache hit)" : "";
  return `${prefix} ${formatBytes(r.bytesProcessed)} (${r.bytesProcessed} bytes)${cache}`;
}
