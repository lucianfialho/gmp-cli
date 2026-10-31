import { Command } from "commander";
import { google, analyticsdata_v1beta } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { rowsToObjects } from "./helpers.js";
import { resolveProperty } from "../../lib/config.js";

type DimensionHeader = analyticsdata_v1beta.Schema$DimensionHeader;
type MetricHeader = analyticsdata_v1beta.Schema$MetricHeader;

export function registerRealtimeCommand(ga: Command): void {
  ga.command("realtime")
    .description("Run a realtime report")
    .option("-p, --property <id>", "GA4 property ID; defaults to `gmp config set property`")
    .requiredOption("-m, --metrics <list>", "Comma-separated metrics")
    .option("-d, --dimensions <list>", "Comma-separated dimensions")
    .option("-l, --limit <n>", "Row limit", "100")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        const property = resolveProperty(opts.property);
        const auth = getAuthClient();
        const analyticsData = google.analyticsdata({ version: "v1beta", auth });

        const metrics = (opts.metrics as string).split(",").map((m) => ({ name: m.trim() }));
        const dimensions = opts.dimensions
          ? (opts.dimensions as string).split(",").map((d) => ({ name: d.trim() }))
          : undefined;

        const response = await analyticsData.properties.runRealtimeReport({
          property: `properties/${property}`,
          requestBody: { metrics, dimensions, limit: opts.limit as string },
        });

        const dimHeaders = (response.data.dimensionHeaders || []).map((h: DimensionHeader) => h.name || "");
        const metricHeaders = (response.data.metricHeaders || []).map((h: MetricHeader) => h.name || "");
        const headers = [...dimHeaders, ...metricHeaders];
        const rows = rowsToObjects(response.data.rows || [], dimHeaders, metricHeaders);

        console.log(formatOutput(rows, opts.format as OutputFormat, headers));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
