import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { applyPrivacyFilter, costSummary, parseMaxBytes, runBqQuery } from "./shared.js";

export function registerCustomCommand(bq: Command): void {
  bq.command("custom")
    .description("Run a custom SQL query against BigQuery")
    .requiredOption("--project <id>", "GCP project ID")
    .requiredOption("-q, --query <sql>", "SQL query to execute")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .option("--dry-run", "Validate and estimate bytes processed without running or billing the query")
    .option("--max-bytes <n>", "Fail (without billing) if the query would bill more than n bytes; accepts KB/MB/GB/TB")
    .option("--privacy-filter", "Mask PII before output (set GMP_PII_SALT for pseudonymization)")
    .action(async (opts) => {
      try {
        const cost = { dryRun: Boolean(opts.dryRun), maxBytes: opts.maxBytes ? parseMaxBytes(opts.maxBytes as string) : undefined };
        const auth = getAuthClient();
        const bigquery = google.bigquery({ version: "v2", auth });

        const result = await runBqQuery(bigquery, opts.project, opts.query as string, cost);
        const { fields, rows: rawRows, totalRows } = result;
        const rows = opts.privacyFilter ? applyPrivacyFilter(rawRows) : rawRows;

        if (!cost.dryRun) console.log(formatOutput(rows, opts.format as OutputFormat, fields));

        if (totalRows && !cost.dryRun) {
          console.error(`\n# ${totalRows} total rows`);
        }
        const summary = costSummary(result, cost);
        if (summary) console.error(summary);
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
