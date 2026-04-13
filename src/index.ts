#!/usr/bin/env node

import { Command } from "commander";
import { registerAuthCommand } from "./commands/auth.js";
import { registerGaCommand } from "./commands/ga.js";
import { registerGscCommand } from "./commands/gsc.js";
import { registerAdsCommand } from "./commands/ads.js";
import { registerGtmCommand } from "./commands/gtm.js";
import { registerBqCommand } from "./commands/bq.js";

const program = new Command();

program
  .name("gmp")
  .description("Google Marketing Platform CLI — GA4, Search Console, Ads, GTM")
  .version("1.1.0");

registerAuthCommand(program);
registerGaCommand(program);
registerGscCommand(program);
registerAdsCommand(program);
registerGtmCommand(program);
registerBqCommand(program);

program.parse();
