#!/usr/bin/env node

import { createRequire } from "node:module";
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

// Read the version from the installed package's package.json (one level above
// dist/), so `gmp --version` can never drift from the published version.
const { version } = createRequire(import.meta.url)("../package.json") as {
  version: string;
};

const program = new Command();

program
  .name("gmp")
  .description("Google Marketing Platform CLI — GA4, Search Console, Ads, GTM, Merchant Center, YouTube")
  .version(version);

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
