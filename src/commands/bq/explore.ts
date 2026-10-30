import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { paginateAll } from "../../lib/paginate.js";

export function registerExploreCommand(bq: Command): void {
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
          const allTables = await paginateAll(async (pageToken) => {
            const response = await bigquery.tables.list({
              projectId: opts.project,
              datasetId: opts.dataset,
              maxResults: 1000,
              pageToken,
            });
            return { items: response.data.tables || [], nextPageToken: response.data.nextPageToken };
          });

          const tables = allTables.map((t) => ({
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
}
