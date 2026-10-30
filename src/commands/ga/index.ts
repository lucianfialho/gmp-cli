import { Command } from "commander";
import { registerReportCommand } from "./report.js";
import { registerRealtimeCommand } from "./realtime.js";
import { registerMetadataCommand } from "./metadata.js";
import { registerAccountsCommand } from "./accounts.js";
import { registerPropertiesCommand } from "./properties.js";
import { registerCheckCommand } from "./check.js";
import { registerFunnelCommand } from "./funnel.js";

export function registerGaCommand(program: Command): void {
  const ga = program
    .command("ga")
    .description("Google Analytics Data API (GA4)");

  registerReportCommand(ga);
  registerRealtimeCommand(ga);
  registerMetadataCommand(ga);
  registerAccountsCommand(ga);
  registerPropertiesCommand(ga);
  registerCheckCommand(ga);
  registerFunnelCommand(ga);
}
