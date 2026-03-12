import { Command } from "commander";
import { google, tagmanager_v2 } from "googleapis";
import { getAuthClient } from "../lib/auth.js";
import { formatOutput, type OutputFormat } from "../lib/format.js";

type Account = tagmanager_v2.Schema$Account;
type Container = tagmanager_v2.Schema$Container;
type Tag = tagmanager_v2.Schema$Tag;
type Trigger = tagmanager_v2.Schema$Trigger;
type Variable = tagmanager_v2.Schema$Variable;
type ContainerVersion = tagmanager_v2.Schema$ContainerVersionHeader;

export function registerGtmCommand(program: Command): void {
  const gtm = program
    .command("gtm")
    .description("Google Tag Manager API");

  // --- gtm accounts ---
  gtm.command("accounts")
    .description("List GTM accounts")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const tagmanager = google.tagmanager({ version: "v2", auth });

        const response = await tagmanager.accounts.list();
        const accounts = (response.data.account || []).map((a: Account) => ({
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

  // --- gtm containers ---
  gtm.command("containers")
    .description("List containers for an account")
    .requiredOption("-a, --account <id>", "GTM account ID")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const tagmanager = google.tagmanager({ version: "v2", auth });

        const response = await tagmanager.accounts.containers.list({
          parent: `accounts/${opts.account}`,
        });

        const containers = (response.data.container || []).map((c: Container) => ({
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

  // --- gtm tags ---
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

        const response = await tagmanager.accounts.containers.workspaces.tags.list({
          parent,
        });

        const tags = (response.data.tag || []).map((t: Tag) => ({
          tagId: t.tagId || "",
          name: t.name || "",
          type: t.type || "",
          firingTriggerId: (t.firingTriggerId || []).join(", "),
          paused: String(t.paused ?? false),
        }));

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

  // --- gtm triggers ---
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

        const response = await tagmanager.accounts.containers.workspaces.triggers.list({
          parent,
        });

        const triggers = (response.data.trigger || []).map((t: Trigger) => ({
          triggerId: t.triggerId || "",
          name: t.name || "",
          type: t.type || "",
        }));

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

  // --- gtm variables ---
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

        const response = await tagmanager.accounts.containers.workspaces.variables.list({
          parent,
        });

        const variables = (response.data.variable || []).map((v: Variable) => ({
          variableId: v.variableId || "",
          name: v.name || "",
          type: v.type || "",
        }));

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

  // --- gtm versions ---
  gtm.command("versions")
    .description("List published container versions")
    .requiredOption("-p, --path <path>", "Container path (accounts/X/containers/Y)")
    .option("-l, --limit <n>", "Number of versions", "10")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const tagmanager = google.tagmanager({ version: "v2", auth });

        const response = await tagmanager.accounts.containers.version_headers.list({
          parent: opts.path as string,
        });

        const versions = (response.data.containerVersionHeader || [])
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

async function getLiveWorkspacePath(
  tagmanager: ReturnType<typeof google.tagmanager>,
  containerPath: string
): Promise<string> {
  const response = await tagmanager.accounts.containers.workspaces.list({
    parent: containerPath,
  });

  const workspaces = response.data.workspace || [];
  // Default workspace is usually the first one
  const defaultWs = workspaces.find((w) => w.name === "Default Workspace") || workspaces[0];

  if (!defaultWs?.path) {
    throw new Error("No workspace found. Specify one with -w <workspace_id>");
  }

  return defaultWs.path;
}
