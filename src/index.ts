#!/usr/bin/env node

import { Command } from "commander";
import { registerAuthCommand } from "./commands/auth.js";
import { registerGaCommand } from "./commands/ga.js";

const program = new Command();

program
  .name("gmp")
  .description("Google Marketing Platform CLI — GA4, Search Console, Ads, GTM")
  .version("0.1.0");

registerAuthCommand(program);
registerGaCommand(program);

program.parse();
