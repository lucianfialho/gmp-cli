# Roadmap

## v0.1 — Google Analytics (GA4) ✅

- [x] OAuth 2.0 browser-based authentication
- [x] `gmp auth login / logout / status / set-credentials`
- [x] `gmp ga accounts` — list GA4 accounts
- [x] `gmp ga properties` — list properties for an account
- [x] `gmp ga report` — run reports with dimensions, metrics, filters, date ranges
- [x] `gmp ga realtime` — realtime active users and dimensions
- [x] `gmp ga metadata` — list available metrics and dimensions
- [x] `gmp ga check` — validate metric/dimension compatibility
- [x] Output formats: json, table, csv
- [x] OpenClaw-compatible agent skills (11 skills)

## v0.2 — Google Search Console

- [ ] `gmp gsc sites` — list verified sites
- [ ] `gmp gsc report` — search analytics (clicks, impressions, CTR, position)
- [ ] `gmp gsc inspect` — check URL indexation status
- [ ] `gmp gsc sitemaps` — list and check sitemaps
- [ ] Skills: recipe-keyword-performance, recipe-indexation-check, persona-seo-specialist update

## v0.3 — Google Tag Manager

- [ ] `gmp gtm accounts` — list GTM accounts
- [ ] `gmp gtm containers` — list containers
- [ ] `gmp gtm tags` — list tags in a container
- [ ] `gmp gtm triggers` — list triggers
- [ ] `gmp gtm variables` — list variables
- [ ] `gmp gtm versions` — list published versions
- [ ] Skills: recipe-tag-audit, recipe-container-export

## v0.4 — Google Ads

- [ ] `gmp ads accounts` — list accessible accounts
- [ ] `gmp ads campaigns` — campaign performance (clicks, impressions, cost, conversions)
- [ ] `gmp ads adgroups` — ad group performance
- [ ] `gmp ads keywords` — keyword performance
- [ ] `gmp ads search-terms` — actual search terms that triggered ads
- [ ] Skills: recipe-campaign-performance, recipe-wasted-spend

## v0.5 — Polish & npm

- [ ] Publish to npm (`npm install -g gmp-cli`)
- [ ] Embed default OAuth client_id (no setup needed)
- [ ] `gmp config set property <id>` — set default property
- [ ] `gmp config set account <id>` — set default account
- [ ] Auto-pagination for large result sets
- [ ] `--sort` and `--order` flags for reports
- [ ] `--compare` flag for period-over-period in a single command

## v1.0 — Cross-service Workflows

- [ ] `gmp dashboard` — unified overview (GA + GSC + Ads)
- [ ] Cross-API recipes (organic keywords → landing page performance)
- [ ] `gmp export` — scheduled report export
- [ ] Advanced personas (CRO analyst, paid media manager)
- [ ] ClawHub registry submission
