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

## v0.2 — Google Search Console ✅

- [x] `gmp gsc sites` — list verified sites
- [x] `gmp gsc report` — search analytics (clicks, impressions, CTR, position)
- [x] `gmp gsc inspect` — check URL indexation status
- [x] `gmp gsc sitemaps` — list and check sitemaps
- [x] Skills: recipe-keyword-performance, recipe-indexation-check, persona-seo-specialist update

## v0.3 — Google Tag Manager ✅

- [x] `gmp gtm accounts` — list GTM accounts
- [x] `gmp gtm containers` — list containers
- [x] `gmp gtm tags` — list tags in a container
- [x] `gmp gtm triggers` — list triggers
- [x] `gmp gtm variables` — list variables
- [x] `gmp gtm versions` — list published versions
- [x] Skills: recipe-tag-audit, recipe-container-export

## v0.4 — Google Ads ✅

- [x] `gmp ads accounts` — list accessible accounts
- [x] `gmp ads campaigns` — campaign performance (clicks, impressions, cost, conversions)
- [x] `gmp ads adgroups` — ad group performance
- [x] `gmp ads keywords` — keyword performance
- [x] `gmp ads search-terms` — actual search terms that triggered ads
- [x] Skills: recipe-campaign-performance, recipe-wasted-spend

## v1.0 — Published to npm ✅

- [x] Publish to npm (`npm install -g @lucianfialho/gmp-cli`)
- [x] All 4 GMP APIs integrated (GA4, GSC, GTM, Ads)
- [x] 3 output formats (JSON, table, CSV)
- [x] OpenClaw skills for all services

## v1.6 — YouTube (proposed)

- [x] `gmp yt channel` — subscribers, total views, video count
- [x] `gmp yt videos` — channel uploads with views, likes, comments
- [x] `gmp yt video` — stats for one or more video IDs
- [x] `gmp yt search` — public video search
- [x] API key auth (`YOUTUBE_API_KEY`) with OAuth fallback
- [x] Skills: gmp-yt, gmp-yt-videos
- [ ] YouTube Analytics API — watch time, retention, impression CTR, traffic sources

## v1.1 — Next (in progress)

- [ ] Embed default OAuth client_id (no setup needed)
- [ ] `gmp config set property <id>` — set default property
- [ ] `gmp config set account <id>` — set default account
- [x] Migrate GSC from deprecated webmasters v3 to searchconsole v1 ([#3](https://github.com/lucianfialho/gmp-cli/issues/3))
- [x] GA4 Admin API v1alpha — channel groups ([#1](https://github.com/lucianfialho/gmp-cli/issues/1)) — `gmp ga channel-groups list/get/create/update/delete`; streams list/get and other v1alpha endpoints from #1 still open
- [x] GA4 Data API v1alpha — funnel reports ([#2](https://github.com/lucianfialho/gmp-cli/issues/2)) — `gmp ga funnel`; audience-list/report-task still open
- [x] Auto-pagination for large result sets — `ga accounts/properties/channel-groups`, `gtm accounts/containers/tags/triggers/variables/versions`, `bq explore/query/custom`
- [ ] `--sort` and `--order` flags for reports
- [ ] `--compare` flag for period-over-period

## v2.0 — Cross-service Workflows

- [ ] `gmp dashboard` — unified overview (GA + GSC + Ads)
- [ ] Cross-API recipes (organic keywords → landing page performance)
- [ ] `gmp export` — scheduled report export
- [ ] GA4 Admin v1alpha — audiences, permissions, linking ([#4](https://github.com/lucianfialho/gmp-cli/issues/4))
- [ ] Advanced personas (CRO analyst, paid media manager)
