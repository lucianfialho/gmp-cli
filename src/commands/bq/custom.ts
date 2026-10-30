import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { applyPrivacyFilter, runBqQuery } from "./shared.js";

export function registerCustomCommand(bq: Command): void {
  bq.command("custom")
    .description("Run a custom SQL query against BigQuery")
    .requiredOption("--project <id>", "GCP project ID")
    .requiredOption("-q, --query <sql>", "SQL query to execute")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .option("--privacy-filter", "Mask PII before output (set GMP_PII_SALT for pseudonymization)")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const bigquery = google.bigquery({ version: "v2", auth });

        const { fields, rows: rawRows, totalRows } = await runBqQuery(bigquery, opts.project, opts.query as string);
        const rows = opts.privacyFilter ? applyPrivacyFilter(rawRows) : rawRows;

        console.log(formatOutput(rows, opts.format as OutputFormat, fields));

        if (totalRows) {
          console.error(`\n# ${totalRows} total rows`);
        }
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
