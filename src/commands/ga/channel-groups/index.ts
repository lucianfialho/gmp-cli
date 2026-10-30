import { Command } from "commander";
import { registerListCommand } from "./list.js";
import { registerGetCommand } from "./get.js";
import { registerCreateCommand } from "./create.js";
import { registerUpdateCommand } from "./update.js";
import { registerDeleteCommand } from "./delete.js";

export function registerChannelGroupsCommand(ga: Command): void {
  const channelGroups = ga
    .command("channel-groups")
    .description("Manage GA4 custom channel groups (Admin API v1alpha). Write operations require the analytics.edit OAuth scope.");

  registerListCommand(channelGroups);
  registerGetCommand(channelGroups);
  registerCreateCommand(channelGroups);
  registerUpdateCommand(channelGroups);
  registerDeleteCommand(channelGroups);
}
