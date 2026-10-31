import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../../lib/format.js";
import { resolveProperty } from "../../../lib/config.js";
import { type ChannelGroup, parseRules, toRow } from "./shared.js";

export function registerUpdateCommand(channelGroups: Command): void {
  channelGroups.command("update")
    .description("Update a custom channel group (requires analytics.edit scope)")
    .option("-p, --property <id>", "GA4 property ID (numeric); defaults to `gmp config set property`")
    .requiredOption("-g, --group <id>", "Channel group ID")
    .option("-n, --name <displayName>", "New display name")
    .option("--rules <json>", "New JSON array of GroupingRule objects (replaces all existing rules)")
    .option("--description <text>", "New description")
    .option("--primary", "Set as the primary channel group for reports")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        const property = resolveProperty(opts.property);
        const auth = getAuthClient();
        const admin = google.analyticsadmin({ version: "v1alpha", auth });

        const requestBody: ChannelGroup = {};
        const updateFields: string[] = [];

        if (opts.name !== undefined) {
          requestBody.displayName = opts.name as string;
          updateFields.push("display_name");
        }
        if (opts.rules !== undefined) {
          requestBody.groupingRule = parseRules(opts.rules as string);
          updateFields.push("grouping_rule");
        }
        if (opts.description !== undefined) {
          requestBody.description = opts.description as string;
          updateFields.push("description");
        }
        if (opts.primary !== undefined) {
          requestBody.primary = Boolean(opts.primary);
          updateFields.push("primary");
        }
        if (updateFields.length === 0) {
          throw new Error("Nothing to update — pass at least one of --name, --rules, --description, --primary");
        }

        const response = await admin.properties.channelGroups.patch({
          name: `properties/${property}/channelGroups/${opts.group}`,
          updateMask: updateFields.join(","),
          requestBody,
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
