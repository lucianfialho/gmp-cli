import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { resolveProperty } from "../../lib/config.js";

export function registerCheckCommand(ga: Command): void {
  ga.command("check")
    .description("Check dimension/metric compatibility")
    .option("-p, --property <id>", "GA4 property ID; defaults to `gmp config set property`")
    .requiredOption("-m, --metrics <list>", "Comma-separated metrics")
    .option("-d, --dimensions <list>", "Comma-separated dimensions")
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

        const response = await analyticsData.properties.checkCompatibility({
          property: `properties/${property}`,
          requestBody: { metrics, dimensions },
        });

        const results: Record<string, string>[] = [];

        for (const dc of response.data.dimensionCompatibilities || []) {
          results.push({
            type: "dimension",
            name: dc.dimensionMetadata?.apiName || "",
            compatibility: dc.compatibility || "",
          });
        }
        for (const mc of response.data.metricCompatibilities || []) {
          results.push({
            type: "metric",
            name: mc.metricMetadata?.apiName || "",
            compatibility: mc.compatibility || "",
          });
        }

        console.log(
          formatOutput(results, opts.format as OutputFormat, [
            "type",
            "name",
            "compatibility",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
