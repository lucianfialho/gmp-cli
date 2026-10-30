import { Command } from "commander";
import { google, searchconsole_v1 } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { parseDateRange } from "./date-range.js";

type ApiRow = searchconsole_v1.Schema$ApiDataRow;

export function registerReportCommand(gsc: Command): void {
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
        const searchconsole = google.searchconsole({ version: "v1", auth });

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

        const requestBody: searchconsole_v1.Schema$SearchAnalyticsQueryRequest = {
          startDate,
          endDate,
          dimensions,
          rowLimit: parseInt(opts.limit as string),
          dimensionFilterGroups: dimensionFilterGroups.length > 0 ? dimensionFilterGroups : undefined,
        };

        const response = await searchconsole.searchanalytics.query({
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
}
