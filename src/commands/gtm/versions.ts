import { Command } from "commander";
import { google, tagmanager_v2 } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { paginateAll } from "../../lib/paginate.js";

type ContainerVersion = tagmanager_v2.Schema$ContainerVersionHeader;

export function registerVersionsCommand(gtm: Command): void {
  gtm.command("versions")
    .description("List published container versions")
    .requiredOption("-p, --path <path>", "Container path (accounts/X/containers/Y)")
    .option("-l, --limit <n>", "Number of versions", "10")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const tagmanager = google.tagmanager({ version: "v2", auth });

        const allVersions = await paginateAll(async (pageToken) => {
          const response = await tagmanager.accounts.containers.version_headers.list({
            parent: opts.path as string,
            pageToken,
          });
          return {
            items: response.data.containerVersionHeader || [],
            nextPageToken: response.data.nextPageToken,
          };
        });

        const versions = allVersions
          .slice(0, parseInt(opts.limit as string))
          .map((v: ContainerVersion) => ({
            versionId: v.containerVersionId || "",
            name: v.name || "",
            numTags: v.numTags || "0",
            numTriggers: v.numTriggers || "0",
            numVariables: v.numVariables || "0",
          }));

        console.log(
          formatOutput(versions, opts.format as OutputFormat, [
            "versionId",
            "name",
            "numTags",
            "numTriggers",
            "numVariables",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
