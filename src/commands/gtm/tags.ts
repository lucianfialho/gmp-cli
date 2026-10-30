import { Command } from "commander";
import { google, tagmanager_v2 } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { paginateAll } from "../../lib/paginate.js";
import { getLiveWorkspacePath } from "./workspace.js";

type Tag = tagmanager_v2.Schema$Tag;

export function registerTagsCommand(gtm: Command): void {
  gtm.command("tags")
    .description("List tags in a container workspace")
    .requiredOption("-p, --path <path>", "Container path (accounts/X/containers/Y)")
    .option("-w, --workspace <id>", "Workspace ID", "0")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const tagmanager = google.tagmanager({ version: "v2", auth });

        // Use live version if workspace is 0
        const parent = opts.workspace === "0"
          ? await getLiveWorkspacePath(tagmanager, opts.path as string)
          : `${opts.path}/workspaces/${opts.workspace}`;

        const allTags = await paginateAll(async (pageToken) => {
          const response = await tagmanager.accounts.containers.workspaces.tags.list({
            parent,
            pageToken,
          });
          return { items: response.data.tag || [], nextPageToken: response.data.nextPageToken };
        });

        const isJson = (opts.format as OutputFormat) === "json";
        const tags = allTags.map((t: Tag) => {
          const base = {
            tagId: t.tagId || "",
            name: t.name || "",
            type: t.type || "",
            firingTriggerId: (t.firingTriggerId || []).join(", "),
            paused: String(t.paused ?? false),
          };
          if (!isJson) return base;
          return {
            ...base,
            blockingTriggerId: t.blockingTriggerId || [],
            fingerprint: t.fingerprint || "",
            path: t.path || "",
            parameter: t.parameter || [],
          };
        });

        console.log(
          formatOutput(tags, opts.format as OutputFormat, [
            "tagId",
            "name",
            "type",
            "firingTriggerId",
            "paused",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
