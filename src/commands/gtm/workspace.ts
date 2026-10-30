import { google } from "googleapis";
import { paginateAll } from "../../lib/paginate.js";

export async function getLiveWorkspacePath(
  tagmanager: ReturnType<typeof google.tagmanager>,
  containerPath: string
): Promise<string> {
  const workspaces = await paginateAll(async (pageToken) => {
    const response = await tagmanager.accounts.containers.workspaces.list({
      parent: containerPath,
      pageToken,
    });
    return { items: response.data.workspace || [], nextPageToken: response.data.nextPageToken };
  });

  // Default workspace is usually the first one
  const defaultWs = workspaces.find((w) => w.name === "Default Workspace") || workspaces[0];

  if (!defaultWs?.path) {
    throw new Error("No workspace found. Specify one with -w <workspace_id>");
  }

  return defaultWs.path;
}
