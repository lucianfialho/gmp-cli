import { Command } from "commander";
import { google, tagmanager_v2 } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { paginateAll } from "../../lib/paginate.js";

type Account = tagmanager_v2.Schema$Account;

export function registerAccountsCommand(gtm: Command): void {
  gtm.command("accounts")
    .description("List GTM accounts")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const tagmanager = google.tagmanager({ version: "v2", auth });

        const allAccounts = await paginateAll(async (pageToken) => {
          const response = await tagmanager.accounts.list({ pageToken });
          return { items: response.data.account || [], nextPageToken: response.data.nextPageToken };
        });

        const accounts = allAccounts.map((a: Account) => ({
          accountId: a.accountId || "",
          name: a.name || "",
          path: a.path || "",
          fingerprint: a.fingerprint || "",
        }));

        console.log(
          formatOutput(accounts, opts.format as OutputFormat, [
            "accountId",
            "name",
            "path",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
