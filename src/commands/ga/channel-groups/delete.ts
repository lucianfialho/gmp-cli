import { Command } from "commander";
import { google } from "googleapis";
import { getAuthClient } from "../../../lib/auth.js";

export function registerDeleteCommand(channelGroups: Command): void {
  channelGroups.command("delete")
    .description("Delete a custom channel group (requires analytics.edit scope)")
    .requiredOption("-p, --property <id>", "GA4 property ID (numeric)")
    .requiredOption("-g, --group <id>", "Channel group ID")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const admin = google.analyticsadmin({ version: "v1alpha", auth });

        await admin.properties.channelGroups.delete({
          name: `properties/${opts.property}/channelGroups/${opts.group}`,
        });

        console.log(`Deleted properties/${opts.property}/channelGroups/${opts.group}`);
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
