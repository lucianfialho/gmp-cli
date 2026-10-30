import { Command } from "commander";
import { google, tagmanager_v2 } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { paginateAll } from "../../lib/paginate.js";
import { getLiveWorkspacePath } from "./workspace.js";

type Variable = tagmanager_v2.Schema$Variable;

export function registerVariablesCommand(gtm: Command): void {
  gtm.command("variables")
    .description("List variables in a container workspace")
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

        const allVariables = await paginateAll(async (pageToken) => {
          const response = await tagmanager.accounts.containers.workspaces.variables.list({
            parent,
            pageToken,
          });
          return { items: response.data.variable || [], nextPageToken: response.data.nextPageToken };
        });

        const isJson = (opts.format as OutputFormat) === "json";
        const variables = allVariables.map((v: Variable) => {
          const base = {
            variableId: v.variableId || "",
            name: v.name || "",
            type: v.type || "",
          };
          if (!isJson) return base;
          return {
            ...base,
            fingerprint: v.fingerprint || "",
            path: v.path || "",
            parameter: v.parameter || [],
          };
        });

        console.log(
          formatOutput(variables, opts.format as OutputFormat, [
            "variableId",
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
