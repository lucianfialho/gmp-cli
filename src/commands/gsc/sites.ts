import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";

export function registerSitesCommand(gsc: Command): void {
  gsc.command("sites")
    .description("List verified sites")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const searchconsole = google.searchconsole({ version: "v1", auth });

        const response = await searchconsole.sites.list();
        const sites = (response.data.siteEntry || []).map((s) => ({
          siteUrl: s.siteUrl || "",
          permissionLevel: s.permissionLevel || "",
        }));

        console.log(
          formatOutput(sites, opts.format as OutputFormat, [
            "siteUrl",
            "permissionLevel",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
