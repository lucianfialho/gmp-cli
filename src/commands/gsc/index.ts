import { Command } from "commander";
import { registerSitesCommand } from "./sites.js";
import { registerReportCommand } from "./report.js";
import { registerInspectCommand } from "./inspect.js";
import { registerSitemapsCommand } from "./sitemaps.js";

export function registerGscCommand(program: Command): void {
  const gsc = program
    .command("gsc")
    .description("Google Search Console API");

  registerSitesCommand(gsc);
  registerReportCommand(gsc);
  registerInspectCommand(gsc);
  registerSitemapsCommand(gsc);
}
