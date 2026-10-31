import { Command } from "commander";
import { setDefaultProperty, setDefaultAccount, showDefaults } from "../lib/config.js";

export function registerConfigCommand(program: Command): void {
  const config = program
    .command("config")
    .description("Manage default GA4 property/account IDs");

  const set = config.command("set").description("Set a default value");

  set
    .command("property")
    .description("Default GA4 property ID used when -p/--property is omitted")
    .argument("<id>", "GA4 property ID (numeric)")
    .action((id: string) => setDefaultProperty(id));

  set
    .command("account")
    .description("Default GA4 account ID used when -a/--account is omitted")
    .argument("<id>", "GA4 account ID (numeric)")
    .action((id: string) => setDefaultAccount(id));

  config
    .command("show")
    .description("Show the current default property/account")
    .action(() => showDefaults());
}
