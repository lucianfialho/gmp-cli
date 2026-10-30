import { Command } from "commander";
import { google, analyticsdata_v1beta } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { parseDateRange, rowsToObjects } from "./helpers.js";

type DimensionHeader = analyticsdata_v1beta.Schema$DimensionHeader;
type MetricHeader = analyticsdata_v1beta.Schema$MetricHeader;

export function registerReportCommand(ga: Command): void {
  ga.command("report")
    .description("Run a report (dimensions + metrics)")
    .requiredOption("-p, --property <id>", "GA4 property ID (numeric)")
    .requiredOption("-m, --metrics <list>", "Comma-separated metrics")
    .option("-d, --dimensions <list>", "Comma-separated dimensions")
    .option("-r, --date-range <range>", "Date range: 30d, 7d, 2024-01-01..2024-01-31", "30d")
    .option("-l, --limit <n>", "Row limit", "10000")
    .option("--filter <expr>", "Dimension filter (fieldName==value)")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const analyticsData = google.analyticsdata({ version: "v1beta", auth });

        const dateRange = parseDateRange(opts.dateRange);
        const metrics = (opts.metrics as string).split(",").map((m) => ({ name: m.trim() }));
        const dimensions = opts.dimensions
          ? (opts.dimensions as string).split(",").map((d) => ({ name: d.trim() }))
          : undefined;

        let dimensionFilter: analyticsdata_v1beta.Schema$FilterExpression | undefined;
        if (opts.filter) {
          const [field, value] = (opts.filter as string).split("==");
          if (field && value) {
            dimensionFilter = {
              filter: {
                fieldName: field.trim(),
                stringFilter: { value: value.trim(), matchType: "EXACT" },
              },
            };
          }
        }

        const response = await analyticsData.properties.runReport({
          property: `properties/${opts.property}`,
          requestBody: {
            dateRanges: [dateRange],
            metrics,
            dimensions,
            dimensionFilter,
            limit: opts.limit as string,
          },
        });

        const dimHeaders = (response.data.dimensionHeaders || []).map((h: DimensionHeader) => h.name || "");
        const metricHeaders = (response.data.metricHeaders || []).map((h: MetricHeader) => h.name || "");
        const headers = [...dimHeaders, ...metricHeaders];
        const rows = rowsToObjects(response.data.rows || [], dimHeaders, metricHeaders);

        console.log(formatOutput(rows, opts.format as OutputFormat, headers));

        if (response.data.rowCount) {
          console.error(`\n# ${response.data.rowCount} total rows`);
        }
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
