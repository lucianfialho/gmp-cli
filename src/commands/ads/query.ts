import { Command } from "commander";
import { queryAds } from "./shared.js";

export function registerQueryCommand(ads: Command): void {
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
