import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { getTemplate, listTemplates, renderTemplate } from "../../lib/bq-templates.js";
import { applyPrivacyFilter, costSummary, parseDateRange, parseMaxBytes, runBqQuery } from "./shared.js";

export function registerQueryCommand(bq: Command): void {
  bq.command("query")
    .description("Run a pre-built query template")
    .requiredOption("-t, --template <name>", "Template name")
    .requiredOption("--project <id>", "GCP project ID")
    .requiredOption("--dataset <name>", "BigQuery dataset name")
    .option(
      "-r, --date-range <range>",
      "Date range: 30d, 7d, 2024-01-01..2024-01-31",
      "30d"
    )
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .option("--dry-run", "Validate and estimate bytes processed without running or billing the query")
    .option("--max-bytes <n>", "Fail (without billing) if the query would bill more than n bytes; accepts KB/MB/GB/TB")
    .option("--privacy-filter", "Mask PII before output (set GMP_PII_SALT for pseudonymization)")
    .action(async (opts) => {
      try {
        const tpl = getTemplate(opts.template);
        if (!tpl) {
          const available = listTemplates()
            .map((t) => t.name)
            .join(", ");
          console.error(
            `Unknown template: ${opts.template}\nAvailable: ${available}`
          );
          process.exit(1);
        }

        const dateRange = parseDateRange(opts.dateRange);
        const sql = renderTemplate(tpl, {
          project: opts.project,
          dataset: opts.dataset,
          start_date: dateRange.start,
          end_date: dateRange.end,
        });

        const cost = { dryRun: Boolean(opts.dryRun), maxBytes: opts.maxBytes ? parseMaxBytes(opts.maxBytes as string) : undefined };
        const auth = getAuthClient();
        const bigquery = google.bigquery({ version: "v2", auth });

        const result = await runBqQuery(bigquery, opts.project, sql, cost);
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
