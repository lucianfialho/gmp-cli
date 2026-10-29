import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";

export function registerSitemapsCommand(gsc: Command): void {
  gsc.command("sitemaps")
    .description("List sitemaps for a site")
    .requiredOption("-s, --site <url>", "Site URL")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const searchconsole = google.searchconsole({ version: "v1", auth });

        const response = await searchconsole.sitemaps.list({
          siteUrl: opts.site as string,
        });

        const sitemaps = (response.data.sitemap || []).map((s) => ({
          path: s.path || "",
          type: s.type || "",
          submitted: s.lastSubmitted || "",
          downloaded: s.lastDownloaded || "",
          isPending: String(s.isPending ?? false),
          warnings: String(s.warnings ?? 0),
          errors: String(s.errors ?? 0),
        }));

        console.log(
          formatOutput(sitemaps, opts.format as OutputFormat, [
            "path",
            "type",
            "submitted",
            "downloaded",
            "warnings",
            "errors",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
