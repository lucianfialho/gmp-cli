import { Command } from "commander";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { extractField, formatMicros, formatRate, queryAds, resolveOrderBy } from "./shared.js";

const SORT_FIELDS: Record<string, string> = {
  impressions: "metrics.impressions",
  clicks: "metrics.clicks",
  cost: "metrics.cost_micros",
  conversions: "metrics.conversions",
  convValue: "metrics.conversions_value",
  ctr: "metrics.ctr",
  avgCpc: "metrics.average_cpc",
};

export function registerCampaignsCommand(ads: Command): void {
  ads.command("campaigns")
    .description("Campaign performance report")
    .requiredOption("-c, --customer-id <id>", "Customer ID")
    .option("-r, --date-range <range>", "Date range: LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH, LAST_MONTH", "LAST_30_DAYS")
    .option("--status <s>", "Filter: ENABLED, PAUSED, REMOVED")
    .option("-l, --limit <n>", "Row limit", "50")
    .option("--sort <field>", `Sort by: ${Object.keys(SORT_FIELDS).join(", ")}`)
    .option("--order <dir>", "Sort direction: asc, desc", "desc")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        let where = `segments.date DURING ${opts.dateRange}`;
        if (opts.status) {
          where += ` AND campaign.status = '${opts.status}'`;
        }
        const orderBy = resolveOrderBy(opts.sort, opts.order, SORT_FIELDS, "metrics.cost_micros DESC");

        const rows = await queryAds(
          opts.customerId as string,
          `SELECT
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            metrics.ctr,
            metrics.average_cpc
          FROM campaign
          WHERE ${where}
          ORDER BY ${orderBy}
          LIMIT ${opts.limit}`
        );

        const results = rows.map((row) => ({
          campaign: extractField(row, "campaign.name"),
          status: extractField(row, "campaign.status"),
          type: extractField(row, "campaign.advertisingChannelType"),
          impressions: extractField(row, "metrics.impressions"),
          clicks: extractField(row, "metrics.clicks"),
          cost: formatMicros(extractField(row, "metrics.costMicros")),
          conversions: extractField(row, "metrics.conversions"),
          convValue: extractField(row, "metrics.conversionsValue"),
          ctr: formatRate(extractField(row, "metrics.ctr")),
          avgCpc: formatMicros(extractField(row, "metrics.averageCpc")),
        }));

        console.log(
          formatOutput(results, opts.format as OutputFormat, [
            "campaign",
            "status",
            "type",
            "impressions",
            "clicks",
            "cost",
            "conversions",
            "ctr",
            "avgCpc",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
