import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";

export function registerPropertiesCommand(ga: Command): void {
  ga.command("properties")
    .description("List GA4 properties for an account")
    .requiredOption("-a, --account <id>", "Account ID (numeric)")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const admin = google.analyticsadmin({ version: "v1beta", auth });

        const response = await admin.properties.list({
          filter: `parent:accounts/${opts.account}`,
        });

        const properties = (response.data.properties || []).map((p) => ({
          name: p.name || "",
          displayName: p.displayName || "",
          propertyType: p.propertyType || "",
          timeZone: p.timeZone || "",
          currencyCode: p.currencyCode || "",
        }));

        console.log(
          formatOutput(properties, opts.format as OutputFormat, [
            "name",
            "displayName",
            "propertyType",
            "timeZone",
            "currencyCode",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
