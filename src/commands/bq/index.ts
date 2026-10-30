import { Command } from "commander";
import { registerTemplatesCommand } from "./templates.js";
import { registerQueryCommand } from "./query.js";
import { registerExploreCommand } from "./explore.js";
import { registerCustomCommand } from "./custom.js";

export function registerBqCommand(program: Command): void {
  const bq = program
    .command("bq")
    .description("BigQuery queries for GMP export data (GA4, Ads, GSC)");

  registerTemplatesCommand(bq);
  registerQueryCommand(bq);
  registerExploreCommand(bq);
  registerCustomCommand(bq);
}
