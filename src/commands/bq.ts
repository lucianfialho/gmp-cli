import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../lib/auth.js";
import { formatOutput, type OutputFormat } from "../lib/format.js";
import {
  listTemplates,
  getTemplate,
  renderTemplate,
} from "../lib/bq-templates.js";
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

function applyPrivacyFilter(rows: Record<string, string>[]): Record<string, string>[] {
  const salt = process.env.GMP_PII_SALT;
  const options = salt
    ? { mode: "pseudonymize" as const, salt, knownPiiFields: GA4_PII_FIELDS }
    : { mode: "redact" as const, knownPiiFields: GA4_PII_FIELDS };
  return rows.map((row) => filterPii(row, options) as Record<string, string>);
}

function parseDateForBq(input: string): string {
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

function parseDateRange(range: string): { start: string; end: string } {
  if (range.includes("..")) {
    const [s, e] = range.split("..");
    return { start: parseDateForBq(s!), end: parseDateForBq(e!) };
  }
  return { start: parseDateForBq(range), end: parseDateForBq("today") };
}

export function registerBqCommand(program: Command): void {
  const bq = program
    .command("bq")
    .description("BigQuery queries for GMP export data (GA4, Ads, GSC)");

  // --- bq templates ---
  bq.command("templates")
    .description("List available pre-built query templates")
    .option("--service <svc>", "Filter by service: ga4, ads, gsc")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action((opts) => {
      const tpls = listTemplates(opts.service);

      if (tpls.length === 0) {
        console.log(
          opts.service
            ? `No templates found for service: ${opts.service}`
            : "No templates found"
        );
        return;
      }

      const rows = tpls.map((t) => ({
        name: t.name,
        service: t.service,
        description: t.description,
        params: t.params.join(", "),
      }));

      console.log(
        formatOutput(rows, opts.format as OutputFormat, [
          "name",
          "service",
          "description",
          "params",
        ])
      );
    });

  // --- bq query ---
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

        const response = await bigquery.jobs.query({
          projectId: opts.project,
          requestBody: {
            query: sql,
            useLegacySql: false,
            maxResults: 10000,
          },
        });

        const fields = (response.data.schema?.fields || []).map(
          (f) => f.name || ""
        );
        let rows = (response.data.rows || []).map((row) => {
          const obj: Record<string, string> = {};
          (row.f || []).forEach((cell, i) => {
            obj[fields[i]!] = String(cell.v ?? "");
          });
          return obj;
        });

        if (opts.privacyFilter) rows = applyPrivacyFilter(rows);

        console.log(formatOutput(rows, opts.format as OutputFormat, fields));

        if (response.data.totalRows) {
          console.error(`\n# ${response.data.totalRows} total rows`);
        }
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  // --- bq explore ---
  bq.command("explore")
    .description("List tables and schema in a BigQuery dataset")
    .requiredOption("--project <id>", "GCP project ID")
    .requiredOption("--dataset <name>", "BigQuery dataset name")
    .option("--table <name>", "Show schema for a specific table")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const bigquery = google.bigquery({ version: "v2", auth });

        if (opts.table) {
          // Show schema for specific table
          const response = await bigquery.tables.get({
            projectId: opts.project,
            datasetId: opts.dataset,
            tableId: opts.table,
          });

          const fields = (response.data.schema?.fields || []).map((f) => ({
            name: f.name || "",
            type: f.type || "",
            mode: f.mode || "NULLABLE",
            description: f.description || "",
          }));

          console.log(
            formatOutput(fields, opts.format as OutputFormat, [
              "name",
              "type",
              "mode",
              "description",
            ])
          );
        } else {
          // List all tables in dataset
          const response = await bigquery.tables.list({
            projectId: opts.project,
            datasetId: opts.dataset,
            maxResults: 1000,
          });

          const tables = (response.data.tables || []).map((t) => ({
            tableId: t.tableReference?.tableId || "",
            type: t.type || "",
            created: t.creationTime
              ? new Date(parseInt(t.creationTime)).toISOString().slice(0, 10)
              : "",
          }));

          console.log(
            formatOutput(tables, opts.format as OutputFormat, [
              "tableId",
              "type",
              "created",
            ])
          );
        }
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  // --- bq custom ---
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

        const response = await bigquery.jobs.query({
          projectId: opts.project,
          requestBody: {
            query: opts.query,
            useLegacySql: false,
            maxResults: 10000,
          },
        });

        const fields = (response.data.schema?.fields || []).map(
          (f) => f.name || ""
        );
        let rows = (response.data.rows || []).map((row) => {
          const obj: Record<string, string> = {};
          (row.f || []).forEach((cell, i) => {
            obj[fields[i]!] = String(cell.v ?? "");
          });
          return obj;
        });

        if (opts.privacyFilter) rows = applyPrivacyFilter(rows);

        console.log(formatOutput(rows, opts.format as OutputFormat, fields));

        if (response.data.totalRows) {
          console.error(`\n# ${response.data.totalRows} total rows`);
        }
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
