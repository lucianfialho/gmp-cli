import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { resolveProperty } from "../../lib/config.js";

export function registerMetadataCommand(ga: Command): void {
  ga.command("metadata")
    .description("List available dimensions and metrics")
    .option("-p, --property <id>", "GA4 property ID; defaults to `gmp config set property`")
    .option("--type <type>", "Filter: dimensions, metrics, or all", "all")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const property = resolveProperty(opts.property);
        const auth = getAuthClient();
        const analyticsData = google.analyticsdata({ version: "v1beta", auth });

        const response = await analyticsData.properties.getMetadata({
          name: `properties/${property}/metadata`,
        });

        const data = response.data;
        const results: Record<string, string>[] = [];

        if (opts.type === "all" || opts.type === "dimensions") {
          for (const dim of data.dimensions || []) {
            results.push({
              type: "dimension",
              apiName: dim.apiName || "",
              uiName: dim.uiName || "",
              category: dim.category || "",
              description: dim.description || "",
            });
          }
        }

        if (opts.type === "all" || opts.type === "metrics") {
          for (const met of data.metrics || []) {
            results.push({
              type: "metric",
              apiName: met.apiName || "",
              uiName: met.uiName || "",
              category: met.category || "",
              description: met.description || "",
            });
          }
        }

        console.log(
          formatOutput(results, opts.format as OutputFormat, [
            "type",
            "apiName",
            "uiName",
            "category",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
