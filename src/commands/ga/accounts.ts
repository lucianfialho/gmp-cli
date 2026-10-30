import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";

export function registerAccountsCommand(ga: Command): void {
  ga.command("accounts")
    .description("List GA4 accounts")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const admin = google.analyticsadmin({ version: "v1beta", auth });

        const response = await admin.accounts.list();
        const accounts = (response.data.accounts || []).map((a) => ({
          name: a.name || "",
          displayName: a.displayName || "",
          createTime: a.createTime || "",
          regionCode: a.regionCode || "",
        }));

        console.log(
          formatOutput(accounts, opts.format as OutputFormat, [
            "name",
            "displayName",
            "regionCode",
            "createTime",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
