import { Command } from "commander";
import { google, tagmanager_v2 } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { paginateAll } from "../../lib/paginate.js";

type Container = tagmanager_v2.Schema$Container;

export function registerContainersCommand(gtm: Command): void {
  gtm.command("containers")
    .description("List containers for an account")
    .requiredOption("-a, --account <id>", "GTM account ID")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const tagmanager = google.tagmanager({ version: "v2", auth });

        const allContainers = await paginateAll(async (pageToken) => {
          const response = await tagmanager.accounts.containers.list({
            parent: `accounts/${opts.account}`,
            pageToken,
          });
          return { items: response.data.container || [], nextPageToken: response.data.nextPageToken };
        });

        const containers = allContainers.map((c: Container) => ({
          containerId: c.containerId || "",
          name: c.name || "",
          publicId: c.publicId || "",
          usageContext: (c.usageContext || []).join(", "),
          domainName: (c.domainName || []).join(", "),
          path: c.path || "",
        }));

        console.log(
          formatOutput(containers, opts.format as OutputFormat, [
            "containerId",
            "name",
            "publicId",
            "usageContext",
            "domainName",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
