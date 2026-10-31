import { Command } from "commander";
import { getAuthClient, getAdsConfig } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { ADS_BASE_URL, extractField, queryAds } from "./shared.js";

export function registerAccountsCommand(ads: Command): void {
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

          const data = (await response.json()) as { resourceNames?: string[] };
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
}
