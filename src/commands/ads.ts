import { Command } from "commander";
import { getAuthClient, getAdsConfig } from "../lib/auth.js";
import { formatOutput, type OutputFormat } from "../lib/format.js";

const ADS_API_VERSION = "v23";
const ADS_BASE_URL = `https://googleads.googleapis.com/${ADS_API_VERSION}`;

interface GaqlRow {
  [resource: string]: {
    [field: string]: unknown;
  };
}

async function queryAds(
  customerId: string,
  query: string
): Promise<GaqlRow[]> {
  const auth = getAuthClient();
  const adsConfig = getAdsConfig();

  if (!adsConfig.developerToken) {
    throw new Error(
      "Google Ads developer token not set. Run: gmp auth set-developer-token YOUR_TOKEN"
    );
  }

  const token = await auth.getAccessToken();
  if (!token.token) {
    throw new Error("Failed to get access token. Run: gmp auth login");
  }

  const cid = customerId.replace(/-/g, "");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token.token}`,
    "developer-token": adsConfig.developerToken,
    "Content-Type": "application/json",
  };

  if (adsConfig.loginCustomerId) {
    headers["login-customer-id"] = adsConfig.loginCustomerId;
  }

  const response = await fetch(`${ADS_BASE_URL}/customers/${cid}/googleAds:searchStream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Ads API error (${response.status}): ${body}`);
  }

  const data = await response.json() as Array<{ results?: GaqlRow[] }>;
  const rows: GaqlRow[] = [];
  for (const batch of data) {
    if (batch.results) {
      rows.push(...batch.results);
    }
  }
  return rows;
}

function extractField(row: GaqlRow, path: string): string {
  const [resource, ...fields] = path.split(".");
  let value: unknown = row[resource!];
  for (const field of fields) {
    if (value && typeof value === "object") {
      value = (value as Record<string, unknown>)[field];
    } else {
      return "";
    }
  }
  return String(value ?? "");
}

function formatMicros(micros: string): string {
  const num = parseInt(micros);
  if (isNaN(num)) return micros;
  return (num / 1_000_000).toFixed(2);
}

function formatRate(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return (num * 100).toFixed(2) + "%";
}

export function registerAdsCommand(program: Command): void {
  const ads = program
    .command("ads")
    .description("Google Ads API");

  // --- ads accounts ---
  ads.command("accounts")
    .description("List accessible customer accounts")
    .option("-c, --customer-id <id>", "Manager account (MCC) customer ID (for detailed list)")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        if (opts.customerId) {
          // Detailed list via GAQL (needs MCC customer ID)
          const rows = await queryAds(
            opts.customerId as string,
            `SELECT
              customer_client.client_customer,
              customer_client.descriptive_name,
              customer_client.id,
              customer_client.status,
              customer_client.manager
            FROM customer_client
            WHERE customer_client.status = 'ENABLED'
            ORDER BY customer_client.descriptive_name`
          );

          const results = rows.map((row) => ({
            id: extractField(row, "customerClient.id"),
            name: extractField(row, "customerClient.descriptiveName"),
            status: extractField(row, "customerClient.status"),
            manager: extractField(row, "customerClient.manager"),
          }));

          console.log(
            formatOutput(results, opts.format as OutputFormat, [
              "id",
              "name",
              "status",
              "manager",
            ])
          );
        } else {
          // Simple list via listAccessibleCustomers (no customer ID needed)
          const auth = getAuthClient();
          const adsConfig = getAdsConfig();

          if (!adsConfig.developerToken) {
            throw new Error(
              "Google Ads developer token not set. Run: gmp auth set-developer-token YOUR_TOKEN"
            );
          }

          const token = await auth.getAccessToken();
          const headers: Record<string, string> = {
            Authorization: `Bearer ${token.token}`,
            "developer-token": adsConfig.developerToken,
          };
          if (adsConfig.loginCustomerId) {
            headers["login-customer-id"] = adsConfig.loginCustomerId;
          }

          const response = await fetch(
            `${ADS_BASE_URL}/customers:listAccessibleCustomers`,
            { headers }
          );

          if (!response.ok) {
            const body = await response.text();
            throw new Error(`Google Ads API error (${response.status}): ${body}`);
          }

          const data = await response.json() as { resourceNames?: string[] };
          const results = (data.resourceNames || []).map((name: string) => ({
            resourceName: name,
            customerId: name.replace("customers/", ""),
          }));

          console.log(
            formatOutput(results, opts.format as OutputFormat, [
              "customerId",
              "resourceName",
            ])
          );
          console.error("\n# Use -c <CUSTOMER_ID> with a manager account for detailed info");
        }
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  // --- ads campaigns ---
  ads.command("campaigns")
    .description("Campaign performance report")
    .requiredOption("-c, --customer-id <id>", "Customer ID")
    .option("-r, --date-range <range>", "Date range: LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH, LAST_MONTH", "LAST_30_DAYS")
    .option("--status <s>", "Filter: ENABLED, PAUSED, REMOVED")
    .option("-l, --limit <n>", "Row limit", "50")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        let where = `segments.date DURING ${opts.dateRange}`;
        if (opts.status) {
          where += ` AND campaign.status = '${opts.status}'`;
        }

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
          ORDER BY metrics.cost_micros DESC
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

  // --- ads adgroups ---
  ads.command("adgroups")
    .description("Ad group performance report")
    .requiredOption("-c, --customer-id <id>", "Customer ID")
    .option("--campaign <name>", "Filter by campaign name (contains)")
    .option("-r, --date-range <range>", "Date range", "LAST_30_DAYS")
    .option("-l, --limit <n>", "Row limit", "50")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        let where = `segments.date DURING ${opts.dateRange}`;
        if (opts.campaign) {
          where += ` AND campaign.name LIKE '%${opts.campaign}%'`;
        }

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
          ORDER BY metrics.cost_micros DESC
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

  // --- ads keywords ---
  ads.command("keywords")
    .description("Keyword performance report")
    .requiredOption("-c, --customer-id <id>", "Customer ID")
    .option("--campaign <name>", "Filter by campaign name (contains)")
    .option("-r, --date-range <range>", "Date range", "LAST_30_DAYS")
    .option("-l, --limit <n>", "Row limit", "50")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        let where = `segments.date DURING ${opts.dateRange}`;
        if (opts.campaign) {
          where += ` AND campaign.name LIKE '%${opts.campaign}%'`;
        }

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
          ORDER BY metrics.impressions DESC
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

  // --- ads search-terms ---
  ads.command("search-terms")
    .description("Search terms report (actual queries that triggered ads)")
    .requiredOption("-c, --customer-id <id>", "Customer ID")
    .option("--campaign <name>", "Filter by campaign name (contains)")
    .option("-r, --date-range <range>", "Date range", "LAST_30_DAYS")
    .option("-l, --limit <n>", "Row limit", "50")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        let where = `segments.date DURING ${opts.dateRange}`;
        if (opts.campaign) {
          where += ` AND campaign.name LIKE '%${opts.campaign}%'`;
        }

        const rows = await queryAds(
          opts.customerId as string,
          `SELECT
            campaign.name,
            search_term_view.search_term,
            search_term_view.status,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr
          FROM search_term_view
          WHERE ${where}
          ORDER BY metrics.impressions DESC
          LIMIT ${opts.limit}`
        );

        const results = rows.map((row) => ({
          campaign: extractField(row, "campaign.name"),
          searchTerm: extractField(row, "searchTermView.searchTerm"),
          status: extractField(row, "searchTermView.status"),
          impressions: extractField(row, "metrics.impressions"),
          clicks: extractField(row, "metrics.clicks"),
          cost: formatMicros(extractField(row, "metrics.costMicros")),
          conversions: extractField(row, "metrics.conversions"),
          ctr: formatRate(extractField(row, "metrics.ctr")),
        }));

        console.log(
          formatOutput(results, opts.format as OutputFormat, [
            "campaign",
            "searchTerm",
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

  // --- ads query (raw GAQL) ---
  ads.command("query")
    .description("Run a raw GAQL query")
    .requiredOption("-c, --customer-id <id>", "Customer ID")
    .requiredOption("-q, --query <gaql>", "GAQL query string")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        const rows = await queryAds(opts.customerId as string, opts.query as string);
        console.log(JSON.stringify(rows, null, 2));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
