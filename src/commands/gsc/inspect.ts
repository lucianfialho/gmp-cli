import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";

export function registerInspectCommand(gsc: Command): void {
  gsc.command("inspect")
    .description("Inspect URL indexation status")
    .requiredOption("-u, --url <url>", "URL to inspect")
    .requiredOption("-s, --site <siteUrl>", "Site URL (must match a verified property)")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const searchconsole = google.searchconsole({ version: "v1", auth });

        const response = await searchconsole.urlInspection.index.inspect({
          requestBody: {
            inspectionUrl: opts.url as string,
            siteUrl: opts.site as string,
          },
        });

        const result = response.data.inspectionResult;
        if (!result) {
          console.log("No inspection result returned.");
          return;
        }

        const indexStatus = result.indexStatusResult;
        const rows = [{
          url: opts.url as string,
          verdict: indexStatus?.verdict || "",
          coverageState: indexStatus?.coverageState || "",
          robotsTxtState: indexStatus?.robotsTxtState || "",
          indexingState: indexStatus?.indexingState || "",
          lastCrawlTime: indexStatus?.lastCrawlTime || "",
          pageFetchState: indexStatus?.pageFetchState || "",
          crawledAs: indexStatus?.crawledAs || "",
          referringUrls: (indexStatus?.referringUrls || []).join(", "),
        }];

        console.log(
          formatOutput(rows, opts.format as OutputFormat, [
            "url",
            "verdict",
            "coverageState",
            "indexingState",
            "lastCrawlTime",
            "pageFetchState",
            "crawledAs",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
