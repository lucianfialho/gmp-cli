import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { paginateAll } from "../../lib/paginate.js";
import { resolveAccount } from "../../lib/config.js";

export function registerPropertiesCommand(ga: Command): void {
  ga.command("properties")
    .description("List GA4 properties for an account")
    .option("-a, --account <id>", "Account ID (numeric); defaults to `gmp config set account`")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const account = resolveAccount(opts.account);
        const auth = getAuthClient();
        const admin = google.analyticsadmin({ version: "v1beta", auth });

        const allProperties = await paginateAll(async (pageToken) => {
          const response = await admin.properties.list({
            filter: `parent:accounts/${account}`,
            pageToken,
          });
          return { items: response.data.properties || [], nextPageToken: response.data.nextPageToken };
        });

        const properties = allProperties.map((p) => ({
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
