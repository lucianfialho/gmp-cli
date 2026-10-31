#!/usr/bin/env node

import { Command } from "commander";
import { registerAuthCommand } from "./commands/auth.js";
import { registerConfigCommand } from "./commands/config.js";
import { registerGaCommand } from "./commands/ga/index.js";
import { registerGscCommand } from "./commands/gsc/index.js";
import { registerAdsCommand } from "./commands/ads/index.js";
import { registerGtmCommand } from "./commands/gtm/index.js";
import { registerBqCommand } from "./commands/bq/index.js";
import { registerPsiCommand } from "./commands/psi.js";
import { registerMcCommand } from "./commands/mc.js";
import { registerYtCommand } from "./commands/yt.js";

const program = new Command();

program
  .name("gmp")
  .description("Google Marketing Platform CLI — GA4, Search Console, Ads, GTM, Merchant Center, YouTube")
  .version("1.5.0");

registerAuthCommand(program);
registerConfigCommand(program);
registerGaCommand(program);
registerGscCommand(program);
registerAdsCommand(program);
registerGtmCommand(program);
registerBqCommand(program);
registerPsiCommand(program);
registerMcCommand(program);
registerYtCommand(program);

program.parse();
