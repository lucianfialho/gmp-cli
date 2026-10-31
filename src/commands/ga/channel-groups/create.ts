import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../../lib/format.js";
import { resolveProperty } from "../../../lib/config.js";
import { type ChannelGroup, parseRules, toRow } from "./shared.js";

export function registerCreateCommand(channelGroups: Command): void {
  channelGroups.command("create")
    .description("Create a custom channel group (requires analytics.edit scope)")
    .option("-p, --property <id>", "GA4 property ID (numeric); defaults to `gmp config set property`")
    .requiredOption("-n, --name <displayName>", "Display name for the channel group")
    .requiredOption(
      "--rules <json>",
      'JSON array of GroupingRule objects, e.g. \'[{"displayName":"Gustavo LinkedIn","expression":{"orGroup":{"filterExpressions":[{"filter":{"fieldName":"sessionSource","stringFilter":{"value":"linkedin","matchType":"CONTAINS"}}}]}}}]\''
    )
    .option("--description <text>", "Description (max 256 characters)")
    .option("--primary", "Set as the primary channel group for reports", false)
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        const property = resolveProperty(opts.property);
        const auth = getAuthClient();
        const admin = google.analyticsadmin({ version: "v1alpha", auth });

        const requestBody: ChannelGroup = {
          displayName: opts.name as string,
          groupingRule: parseRules(opts.rules as string),
          description: opts.description as string | undefined,
          primary: Boolean(opts.primary),
        };

        const response = await admin.properties.channelGroups.create({
          parent: `properties/${property}`,
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
