import { Command } from "commander";
import { google, tagmanager_v2 } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { paginateAll } from "../../lib/paginate.js";
import { getLiveWorkspacePath } from "./workspace.js";

type Trigger = tagmanager_v2.Schema$Trigger;

export function registerTriggersCommand(gtm: Command): void {
  gtm.command("triggers")
    .description("List triggers in a container workspace")
    .requiredOption("-p, --path <path>", "Container path (accounts/X/containers/Y)")
    .option("-w, --workspace <id>", "Workspace ID", "0")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const tagmanager = google.tagmanager({ version: "v2", auth });

        const parent = opts.workspace === "0"
          ? await getLiveWorkspacePath(tagmanager, opts.path as string)
          : `${opts.path}/workspaces/${opts.workspace}`;

        const allTriggers = await paginateAll(async (pageToken) => {
          const response = await tagmanager.accounts.containers.workspaces.triggers.list({
            parent,
            pageToken,
          });
          return { items: response.data.trigger || [], nextPageToken: response.data.nextPageToken };
        });

        const isJson = (opts.format as OutputFormat) === "json";
        const triggers = allTriggers.map((t: Trigger) => {
          const base = {
            triggerId: t.triggerId || "",
            name: t.name || "",
            type: t.type || "",
          };
          if (!isJson) return base;
          return {
            ...base,
            fingerprint: t.fingerprint || "",
            path: t.path || "",
            filter: t.filter || [],
            autoEventFilter: t.autoEventFilter || [],
            parameter: t.parameter || [],
          };
        });

        console.log(
          formatOutput(triggers, opts.format as OutputFormat, [
            "triggerId",
            "name",
            "type",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
