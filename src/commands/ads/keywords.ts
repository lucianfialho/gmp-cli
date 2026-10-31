import { Command } from "commander";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { extractField, formatMicros, formatRate, queryAds, resolveOrderBy } from "./shared.js";

const SORT_FIELDS: Record<string, string> = {
  impressions: "metrics.impressions",
  clicks: "metrics.clicks",
  cost: "metrics.cost_micros",
  conversions: "metrics.conversions",
  ctr: "metrics.ctr",
  avgCpc: "metrics.average_cpc",
  qualityScore: "ad_group_criterion.quality_info.quality_score",
};

export function registerKeywordsCommand(ads: Command): void {
  ads.command("keywords")
    .description("Keyword performance report")
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
        const orderBy = resolveOrderBy(opts.sort, opts.order, SORT_FIELDS, "metrics.impressions DESC");

        const rows = await queryAds(
          opts.customerId as string,
          `SELECT
            campaign.name,
            ad_group.name,
            ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type,
            ad_group_criterion.quality_info.quality_score,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr,
            metrics.average_cpc
          FROM keyword_view
          WHERE ${where}
          ORDER BY ${orderBy}
          LIMIT ${opts.limit}`
        );

        const results = rows.map((row) => ({
          campaign: extractField(row, "campaign.name"),
          adGroup: extractField(row, "adGroup.name"),
          keyword: extractField(row, "adGroupCriterion.keyword.text"),
          matchType: extractField(row, "adGroupCriterion.keyword.matchType"),
          qualityScore: extractField(row, "adGroupCriterion.qualityInfo.qualityScore"),
          impressions: extractField(row, "metrics.impressions"),
          clicks: extractField(row, "metrics.clicks"),
          cost: formatMicros(extractField(row, "metrics.costMicros")),
          conversions: extractField(row, "metrics.conversions"),
          ctr: formatRate(extractField(row, "metrics.ctr")),
          avgCpc: formatMicros(extractField(row, "metrics.averageCpc")),
        }));

        console.log(
          formatOutput(results, opts.format as OutputFormat, [
            "campaign",
            "keyword",
            "matchType",
            "qualityScore",
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
