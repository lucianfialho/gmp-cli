import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { getTemplate, listTemplates, renderTemplate } from "../../lib/bq-templates.js";
import { applyPrivacyFilter, parseDateRange, runBqQuery } from "./shared.js";

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

        const auth = getAuthClient();
        const bigquery = google.bigquery({ version: "v2", auth });

        const { fields, rows: rawRows, totalRows } = await runBqQuery(bigquery, opts.project, sql);
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
