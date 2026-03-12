#!/usr/bin/env node

import { Command } from "commander";
import { registerAuthCommand } from "./commands/auth.js";
import { registerGaCommand } from "./commands/ga.js";
import { registerGscCommand } from "./commands/gsc.js";

const program = new Command();

program
  .name("gmp")
  .description("Google Marketing Platform CLI — GA4, Search Console, Ads, GTM")
  .version("0.2.0");

registerAuthCommand(program);
registerGaCommand(program);
registerGscCommand(program);

program.parse();
