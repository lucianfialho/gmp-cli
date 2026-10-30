import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../../lib/format.js";
import { toRow } from "./shared.js";

export function registerGetCommand(channelGroups: Command): void {
  channelGroups.command("get")
    .description("Get a single channel group's details, including its grouping rules")
    .requiredOption("-p, --property <id>", "GA4 property ID (numeric)")
    .requiredOption("-g, --group <id>", "Channel group ID")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const admin = google.analyticsadmin({ version: "v1alpha", auth });

        const response = await admin.properties.channelGroups.get({
          name: `properties/${opts.property}/channelGroups/${opts.group}`,
        });

        if ((opts.format as OutputFormat) === "json") {
          console.log(JSON.stringify(response.data, null, 2));
          return;
        }
        console.log(formatOutput([toRow(response.data)], opts.format as OutputFormat));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
