import { Command } from "commander";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { extractField, formatMicros, formatRate, queryAds, resolveOrderBy } from "./shared.js";

const SORT_FIELDS: Record<string, string> = {
  impressions: "metrics.impressions",
  clicks: "metrics.clicks",
  cost: "metrics.cost_micros",
  conversions: "metrics.conversions",
  ctr: "metrics.ctr",
};

export function registerAdgroupsCommand(ads: Command): void {
  ads.command("adgroups")
    .description("Ad group performance report")
    .requiredOption("-c, --customer-id <id>", "Customer ID")
    .option("--campaign <name>", "Filter by campaign name (contains)")
    .option("-r, --date-range <range>", "Date range", "LAST_30_DAYS")
    .option("-l, --limit <n>", "Row limit", "50")
    .option("--sort <field>", `Sort by: ${Object.keys(SORT_FIELDS).join(", ")}`)
    .option("--order <dir>", "Sort direction: asc, desc", "desc")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        let where = `segments.date DURING ${opts.dateRange}`;
        if (opts.campaign) {
          where += ` AND campaign.name LIKE '%${opts.campaign}%'`;
        }
        const orderBy = resolveOrderBy(opts.sort, opts.order, SORT_FIELDS, "metrics.cost_micros DESC");

        const rows = await queryAds(
          opts.customerId as string,
          `SELECT
            campaign.name,
            ad_group.name,
            ad_group.status,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr
          FROM ad_group
          WHERE ${where}
          ORDER BY ${orderBy}
          LIMIT ${opts.limit}`
        );

        const results = rows.map((row) => ({
          campaign: extractField(row, "campaign.name"),
          adGroup: extractField(row, "adGroup.name"),
          status: extractField(row, "adGroup.status"),
          impressions: extractField(row, "metrics.impressions"),
          clicks: extractField(row, "metrics.clicks"),
          cost: formatMicros(extractField(row, "metrics.costMicros")),
          conversions: extractField(row, "metrics.conversions"),
          ctr: formatRate(extractField(row, "metrics.ctr")),
        }));

        console.log(
          formatOutput(results, opts.format as OutputFormat, [
            "campaign",
            "adGroup",
            "status",
            "impressions",
            "clicks",
            "cost",
            "conversions",
            "ctr",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
