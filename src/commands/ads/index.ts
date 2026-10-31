import { Command } from "commander";
import { registerAccountsCommand } from "./accounts.js";
import { registerCampaignsCommand } from "./campaigns.js";
import { registerAdgroupsCommand } from "./adgroups.js";
import { registerKeywordsCommand } from "./keywords.js";
import { registerSearchTermsCommand } from "./search-terms.js";
import { registerQueryCommand } from "./query.js";

export function registerAdsCommand(program: Command): void {
  const ads = program
    .command("ads")
    .description("Google Ads API");

  registerAccountsCommand(ads);
  registerCampaignsCommand(ads);
  registerAdgroupsCommand(ads);
  registerKeywordsCommand(ads);
  registerSearchTermsCommand(ads);
  registerQueryCommand(ads);
}
