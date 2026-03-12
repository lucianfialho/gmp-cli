import { Command } from "commander";
import { google, webmasters_v3 } from "googleapis";
import { getAuthClient } from "../lib/auth.js";
import { formatOutput, type OutputFormat } from "../lib/format.js";

type ApiRow = webmasters_v3.Schema$ApiDataRow;

function parseDateRange(range: string): { startDate: string; endDate: string } {
  if (range.includes("..")) {
    const [start, end] = range.split("..");
    return { startDate: start!, endDate: end! };
  }

  const match = range.match(/^(\d+)d$/);
  if (match) {
    const days = parseInt(match[1]!);
    const end = new Date();
    end.setDate(end.getDate() - 3); // GSC data has ~3 day lag
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    return {
      startDate: start.toISOString().split("T")[0]!,
      endDate: end.toISOString().split("T")[0]!,
    };
  }

  // Default: last 28 days (GSC standard)
  const end = new Date();
  end.setDate(end.getDate() - 3);
  const start = new Date(end);
  start.setDate(start.getDate() - 28);
  return {
    startDate: start.toISOString().split("T")[0]!,
    endDate: end.toISOString().split("T")[0]!,
  };
}

export function registerGscCommand(program: Command): void {
  const gsc = program
    .command("gsc")
    .description("Google Search Console API");

  // --- gsc sites ---
  gsc.command("sites")
    .description("List verified sites")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const webmasters = google.webmasters({ version: "v3", auth });

        const response = await webmasters.sites.list();
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

  // --- gsc report ---
  gsc.command("report")
    .description("Search analytics report (clicks, impressions, CTR, position)")
    .requiredOption("-s, --site <url>", "Site URL (e.g. https://example.com or sc-domain:example.com)")
    .option("-d, --dimensions <list>", "Comma-separated: query, page, country, device, date, searchAppearance")
    .option("-r, --date-range <range>", "Date range: 28d, 90d, 2024-01-01..2024-01-31", "28d")
    .option("-l, --limit <n>", "Row limit", "25")
    .option("--query <q>", "Filter by query (contains)")
    .option("--page <p>", "Filter by page URL (contains)")
    .option("--type <t>", "Search type: web, image, video, news, discover, googleNews", "web")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const webmasters = google.webmasters({ version: "v3", auth });

        const { startDate, endDate } = parseDateRange(opts.dateRange);
        const dimensions = opts.dimensions
          ? (opts.dimensions as string).split(",").map((d: string) => d.trim())
          : undefined;

        const dimensionFilterGroups: Array<{
          groupType: string;
          filters: Array<{
            dimension: string;
            operator: string;
            expression: string;
          }>;
        }> = [];

        const filters: Array<{
          dimension: string;
          operator: string;
          expression: string;
        }> = [];

        if (opts.query) {
          filters.push({
            dimension: "query",
            operator: "contains",
            expression: opts.query as string,
          });
        }
        if (opts.page) {
          filters.push({
            dimension: "page",
            operator: "contains",
            expression: opts.page as string,
          });
        }
        if (filters.length > 0) {
          dimensionFilterGroups.push({ groupType: "and", filters });
        }

        const requestBody: webmasters_v3.Schema$SearchAnalyticsQueryRequest = {
          startDate,
          endDate,
          dimensions,
          rowLimit: parseInt(opts.limit as string),
          dimensionFilterGroups: dimensionFilterGroups.length > 0 ? dimensionFilterGroups : undefined,
        };

        const response = await webmasters.searchanalytics.query({
          siteUrl: opts.site as string,
          requestBody,
        });

        const rows = (response.data.rows || []).map((row: ApiRow) => {
          const obj: Record<string, string> = {};
          if (dimensions) {
            (row.keys || []).forEach((key: string, i: number) => {
              obj[dimensions[i]!] = key;
            });
          }
          obj.clicks = String(row.clicks ?? 0);
          obj.impressions = String(row.impressions ?? 0);
          obj.ctr = ((row.ctr ?? 0) * 100).toFixed(2) + "%";
          obj.position = (row.position ?? 0).toFixed(1);
          return obj;
        });

        const headers = [...(dimensions || []), "clicks", "impressions", "ctr", "position"];
        console.log(formatOutput(rows, opts.format as OutputFormat, headers));

        if (response.data.rows) {
          console.error(`\n# ${response.data.rows.length} rows returned`);
        }
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  // --- gsc inspect ---
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

  // --- gsc sitemaps ---
  gsc.command("sitemaps")
    .description("List sitemaps for a site")
    .requiredOption("-s, --site <url>", "Site URL")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const webmasters = google.webmasters({ version: "v3", auth });

        const response = await webmasters.sitemaps.list({
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
