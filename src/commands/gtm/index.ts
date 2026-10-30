import { Command } from "commander";
import { registerAccountsCommand } from "./accounts.js";
import { registerContainersCommand } from "./containers.js";
import { registerTagsCommand } from "./tags.js";
import { registerTriggersCommand } from "./triggers.js";
import { registerVariablesCommand } from "./variables.js";
import { registerVersionsCommand } from "./versions.js";

export function registerGtmCommand(program: Command): void {
  const gtm = program
    .command("gtm")
    .description("Google Tag Manager API");

  registerAccountsCommand(gtm);
  registerContainersCommand(gtm);
  registerTagsCommand(gtm);
  registerTriggersCommand(gtm);
  registerVariablesCommand(gtm);
  registerVersionsCommand(gtm);
}
