import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../../lib/format.js";
import { toRow } from "./shared.js";

export function registerListCommand(channelGroups: Command): void {
  channelGroups.command("list")
    .description("List custom channel groups for a property")
    .requiredOption("-p, --property <id>", "GA4 property ID (numeric)")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const admin = google.analyticsadmin({ version: "v1alpha", auth });

        const response = await admin.properties.channelGroups.list({
          parent: `properties/${opts.property}`,
        });
        const groups = response.data.channelGroups || [];

        if ((opts.format as OutputFormat) === "json") {
          console.log(JSON.stringify(groups, null, 2));
          return;
        }
        console.log(
          formatOutput(groups.map(toRow), opts.format as OutputFormat, [
            "name",
            "displayName",
            "primary",
            "systemDefined",
            "description",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
