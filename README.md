# gmp-cli

A CLI for the Google Marketing Platform — GA4, Search Console, Google Ads, Tag Manager, BigQuery, and YouTube.

Built for AI agents (Gemini CLI, Claude Code) and power users. Pipe JSON output to `jq`, feed it to your agent, or use it in shell scripts.

## Install

```bash
npm install -g @lucianfialho/gmp-cli
```

Or from source:

```bash
git clone https://github.com/lucianfialho/gmp-cli.git
cd gmp-cli
npm install
npm run build
npm link
```

Verify the local build:

```bash
node dist/index.js --help
gmp --help
```

## Authentication

### Setup (first time only)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project (or use an existing one)
3. Enable the APIs you need:
   - **Google Analytics Data API**
   - **Google Analytics Admin API**
   - **Search Console API** (for `gmp gsc`)
   - **Google Ads API** (for `gmp ads`)
   - **YouTube Data API v3** (for `gmp yt`)
4. Go to **APIs & Services > OAuth consent screen** and configure it:
   - User type: External (or Internal for Workspace)
   - Add your email as a test user
5. Go to **APIs & Services > Credentials > Create Credentials > OAuth Client ID**
   - Application type: **Desktop app**
   - Add `http://localhost:3847/callback` to **Authorized redirect URIs**
   - Copy the Client ID and Client Secret

### Login

```bash
# Set your OAuth credentials
gmp auth set-credentials --client-id YOUR_ID --client-secret YOUR_SECRET

# Login (opens your browser)
gmp auth login

# Check status
gmp auth status

# Logout
gmp auth logout
```

Tokens are stored in `~/.config/gmp-cli/tokens.json` and auto-refresh.

### Google Ads (extra setup)

Google Ads API requires a **developer token** in addition to OAuth:

1. Go to [ads.google.com/aw/apicenter](https://ads.google.com/aw/apicenter)
2. Apply for API access and get your developer token
3. Set it in the CLI:

```bash
gmp auth set-developer-token YOUR_DEVELOPER_TOKEN
```

If you use a Manager Account (MCC), set your login customer ID:

```bash
gmp auth set-login-customer-id 1234567890
```

## Google Analytics (GA4)

### List accounts and properties

```bash
gmp ga accounts
gmp ga properties -a 123456789
```

### Run a report

```bash
# Sessions and bounce rate by page, last 30 days
gmp ga report -p 123456789 -m sessions,bounceRate -d pagePath -r 30d

# With filter
gmp ga report -p 123456789 -m sessions -d pagePath --filter "pagePath==/product"

# Custom date range
gmp ga report -p 123456789 -m sessions -r 2024-01-01..2024-01-31

# Output as table or CSV
gmp ga report -p 123456789 -m sessions -d pagePath -f table
gmp ga report -p 123456789 -m sessions -d pagePath -f csv > report.csv
```

### Realtime data

```bash
gmp ga realtime -p 123456789 -m activeUsers
gmp ga realtime -p 123456789 -m activeUsers -d country -f table
```

### Explore available metrics and dimensions

```bash
gmp ga metadata -p 123456789
gmp ga metadata -p 123456789 --type metrics -f table
```

### Check compatibility

```bash
gmp ga check -p 123456789 -m sessions,bounceRate -d pagePath
```

## Google Search Console

### List verified sites

```bash
gmp gsc sites
```

### Search analytics report

```bash
# Top queries, last 28 days
gmp gsc report -s "https://example.com/" -d query -l 10 -f table

# Pages with most clicks
gmp gsc report -s "https://example.com/" -d page -l 10 -f table

# Queries by date
gmp gsc report -s "https://example.com/" -d query,date -r 7d -f table

# Filter by query
gmp gsc report -s "https://example.com/" -d query --query "your keyword" -f table

# Filter by page
gmp gsc report -s "https://example.com/" -d query --page "/blog" -f table

# Custom date range
gmp gsc report -s "https://example.com/" -d query -r 2024-01-01..2024-01-31
```

### Check URL indexation

```bash
gmp gsc inspect -u "https://example.com/page" -s "https://example.com/"
```

### List sitemaps

```bash
gmp gsc sitemaps -s "https://example.com/"
```

## Google Ads

### List accessible accounts

```bash
# Simple list (no MCC needed)
gmp ads accounts

# Detailed list via MCC
gmp ads accounts -c 1234567890 -f table
```

### Campaign performance

```bash
gmp ads campaigns -c 1234567890 -r LAST_30_DAYS -f table
gmp ads campaigns -c 1234567890 --status ENABLED -f table
```

### Ad group performance

```bash
gmp ads adgroups -c 1234567890 -f table
gmp ads adgroups -c 1234567890 --campaign "Brand" -f table
```

### Keyword performance

```bash
gmp ads keywords -c 1234567890 -f table
gmp ads keywords -c 1234567890 --campaign "Brand" -l 20 -f table
```

### Search terms report

```bash
gmp ads search-terms -c 1234567890 -f table
```

### Raw GAQL query

```bash
gmp ads query -c 1234567890 -q "SELECT campaign.name, metrics.clicks FROM campaign WHERE segments.date DURING LAST_7_DAYS"
```

## Google Tag Manager

### List accounts and containers

```bash
gmp gtm accounts
gmp gtm containers -a ACCOUNT_ID
```

### List tags, triggers, and variables

```bash
# Uses default workspace automatically
gmp gtm tags -p accounts/X/containers/Y -f table
gmp gtm triggers -p accounts/X/containers/Y -f table
gmp gtm variables -p accounts/X/containers/Y -f table

# Specific workspace
gmp gtm tags -p accounts/X/containers/Y -w 3 -f table
```

JSON output includes the full API payload — `parameter[]`, `filter[]`, `fingerprint`, `path`, and `blockingTriggerId[]`. Use `-f json` for audits and automation:

```bash
# Find all variable references used inside tag parameters (unused variable audit)
gmp gtm tags -p accounts/X/containers/Y -f json \
  | jq -r '[.[].parameter[]? | .. | strings | scan("\\{\\{([^}]+)\\}\\}")][]' \
  | sort -u
```

### List published versions

```bash
gmp gtm versions -p accounts/X/containers/Y -f table
```

## BigQuery (GMP Export Data)

Query GA4, Google Ads, and GSC data exported to BigQuery using pre-built templates or custom SQL.

> **Note:** Requires re-running `gmp auth login` to grant the `bigquery.readonly` scope.

### List available templates

```bash
gmp bq templates -f table
gmp bq templates --service ga4
gmp bq templates --service ads
gmp bq templates --service gsc
```

### Run a template

```bash
# GA4: Flatten nested event_params
gmp bq query -t ga4-events-flat --project my-project --dataset analytics_123456789 -r 30d

# GA4: Funnel analysis
gmp bq query -t ga4-funnel --project my-project --dataset analytics_123456789 -r 90d -f table

# GA4: Multi-touch attribution
gmp bq query -t ga4-attribution --project my-project --dataset analytics_123456789 -r 2024-01-01..2024-03-31

# Ads: Wasted spend (search terms with zero conversions)
gmp bq query -t ads-wasted-spend --project my-project --dataset my_ads_data -r 30d -f table

# GSC: Top pages by clicks
gmp bq query -t gsc-top-pages --project my-project --dataset searchconsole -r 90d -f table

# GSC: Keyword cannibalization detection
gmp bq query -t gsc-cannibalization --project my-project --dataset searchconsole -r 90d -f table
```

### Explore a dataset

```bash
# List tables
gmp bq explore --project my-project --dataset analytics_123456789

# Show schema for a specific table
gmp bq explore --project my-project --dataset analytics_123456789 --table events_20240101
```

### Run custom SQL

```bash
gmp bq custom --project my-project -q "SELECT event_date, COUNT(*) as events FROM \`my-project.analytics_123456789.events_20240101\` GROUP BY event_date"
```

### Available Templates

| Template | Service | Description |
|----------|---------|-------------|
| `ga4-events-flat` | GA4 | Flatten nested `event_params` into columns |
| `ga4-funnel` | GA4 | Funnel analysis from event sequences |
| `ga4-attribution` | GA4 | Multi-touch attribution (source/medium) |
| `ga4-user-journey` | GA4 | Session-level page paths |
| `ga4-ecommerce` | GA4 | Purchase/revenue with product detail |
| `ga4-retention` | GA4 | Weekly cohort retention |
| `ads-wasted-spend` | Ads | Search terms with spend, zero conversions |
| `ads-quality-trend` | Ads | Keyword quality score over time |
| `ads-cross-campaign` | Ads | Cross-campaign performance comparison |
| `gsc-top-pages` | GSC | Top pages by clicks with CTR/position |
| `gsc-query-clusters` | GSC | Top queries by volume |
| `gsc-cannibalization` | GSC | Queries with multiple competing pages |

## PageSpeed Insights

Run Google PageSpeed Insights (Lighthouse) analysis from the terminal.

> **Note:** Requires a Google API key with the **PageSpeed Insights API** enabled.
>
> **How to get an API key:**
> 1. Go to [console.cloud.google.com](https://console.cloud.google.com)
> 2. Create or select a project
> 3. Go to **APIs & Services → Library**, search for **PageSpeed Insights API** and enable it
> 4. Go to **APIs & Services → Credentials → Create Credentials → API Key**
> 5. (Recommended) Restrict the key to the PageSpeed Insights API only
>
> Set the key as an environment variable or pass it via `--key`:
> ```bash
> export GOOGLE_API_KEY=your_api_key_here
> ```

### Analyze a URL

```bash
# Mobile performance (default)
gmp psi analyze https://example.com

# Desktop with multiple categories
gmp psi analyze https://example.com --strategy desktop --category performance,seo,accessibility

# Portuguese locale, JSON output
gmp psi analyze https://example.com --locale pt-BR -f json

# Pass API key inline
gmp psi analyze https://example.com --key YOUR_API_KEY
```

### Options

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `--strategy` | `mobile`, `desktop` | `mobile` | Device type for analysis |
| `--category` | `performance`, `accessibility`, `best-practices`, `seo`, `pwa` | `performance` | Comma-separated categories to run |
| `--locale` | `en`, `pt-BR`, etc. | `en` | Locale for formatted text |
| `--key` | string | `$GOOGLE_API_KEY` | Google API key |
| `-f, --format` | `json`, `table`, `csv` | `table` | Output format |

### Output (table mode)

Shows three sections:
- **Scores** — 0–100 score per category with rating (good / needs improvement / poor)
- **Lighthouse Metrics** — FCP, LCP, TBT, CLS, Speed Index, TTI, INP with values and scores
- **Field Data (CrUX)** — real-user p75 values from Chrome UX Report when available

Use `-f json` to get the full raw Lighthouse result for deeper analysis.

## Merchant Center

Google Merchant Center via the Merchant API (v1). Requires the `content` OAuth
scope — if you authenticated before v1.5.0, run `gmp auth login` again.

```bash
# List accessible Merchant Center accounts
gmp mc accounts

# Full product catalog with per-item status and issues (paginated automatically)
# stdout: one summary row per product (csv default); --out saves the raw API JSON
gmp mc products -a ACCOUNT_ID --out products.json > products.csv

# Limit for a quick sample
gmp mc products -a ACCOUNT_ID --limit 100 -f table

# Account-level issues (suspensions, policy problems)
gmp mc issues -a ACCOUNT_ID
```

The products summary includes `availability`, `price`, `gtin`, `disapproved`,
`issueCount`, `issueCodes` and `maxSeverity` per product — enough to audit a
feed without any extra API calls. The `--out` JSON keeps the complete
`productAttributes` + `productStatus.itemLevelIssues` for deeper analysis.

## YouTube

Public channel and video stats from the YouTube Data API v3.

### Credentials

`gmp yt` works with either an **API key** or your existing OAuth login. The API key is recommended: these stats are public data, and a key never expires.

```bash
# Enable "YouTube Data API v3" in your Google Cloud project, then
# create an API key under APIs & Services > Credentials
export YOUTUBE_API_KEY=AIza...

# Optional: default channel, so -c can be omitted
export YOUTUBE_CHANNEL_ID=@yourhandle
```

Without `YOUTUBE_API_KEY`, the CLI falls back to your `gmp auth login` token, which carries the `youtube.readonly` scope. In that mode, omitting `--channel` resolves to your own channel.

### Channel overview

```bash
gmp yt channel -c @mkbhd
gmp yt channel -c UCBJycsmduvYEL83R_U4JriQ -f json
```

Returns subscribers, total views, video count and the uploads playlist ID.

### List videos

```bash
# 25 most recent uploads
gmp yt videos -c @mkbhd

# 100 most recent, sorted by views
gmp yt videos -c @mkbhd -n 100 -s views

# Export to CSV
gmp yt videos -c @mkbhd -n 200 -f csv > videos.csv

# Videos above 10k views
gmp yt videos -c @mkbhd -n 100 -f json | jq '[.[] | select(.views > 10000)]'
```

| Flag | Default | Description |
|------|---------|-------------|
| `-c, --channel <ref>` | `$YOUTUBE_CHANNEL_ID` | Channel ID (`UC...`) or `@handle` |
| `-n, --limit <n>` | `25` | How many videos to fetch, most recent first |
| `-s, --sort <field>` | `date` | Sort the fetched window: date, views, likes, comments |

`--sort` orders the videos it fetched, not the whole channel. To rank a full catalog, raise `-n` past the channel's video count.

### Single video

```bash
gmp yt video -i dQw4w9WgXcQ
gmp yt video -i dQw4w9WgXcQ,9bZkp7q19f0 -f table
```

### Search

```bash
gmp yt search -q "product analytics" -n 20
gmp yt search -q "tutorial" -c UCBJycsmduvYEL83R_U4JriQ -o viewCount
```

### Quota

The Data API allows 10,000 units per day by default.

| Command | Cost |
|---------|------|
| `yt channel` | 1 unit |
| `yt videos` | ~2 units per 50 videos |
| `yt video` | 1 unit per 50 IDs |
| `yt search` | 101 units |

`yt videos` walks the uploads playlist instead of calling `search.list`, which is why listing a whole channel stays cheap.

### Scope

This covers public metrics only. Watch time, audience retention, impression CTR and traffic sources come from the YouTube Analytics API, a separate API that is not implemented yet.

## Output Formats

All commands support `-f` / `--format`:

| Format | Description |
|--------|-------------|
| `json` | JSON (default) — best for piping to `jq` or AI agents |
| `table` | Human-readable table |
| `csv` | CSV — pipe to file or other tools |

## What's included

- [x] **Google Analytics (GA4)** — accounts, properties, reports, realtime, metadata
- [x] **Google Search Console** — sites, search analytics, URL inspection, sitemaps
- [x] **Google Ads** — accounts, campaigns, ad groups, keywords, search terms, raw GAQL
- [x] **Google Tag Manager** — accounts, containers, tags, triggers, variables, versions
- [x] **3 output formats** — JSON (pipe to `jq` or AI agents), table, CSV
- [x] **BigQuery** — query GMP export data with 12 pre-built templates
- [x] **PageSpeed Insights** — Lighthouse scores, Core Web Vitals, and CrUX field data
- [x] **Merchant Center** — accounts, product catalog with item-level issues, account issues (Merchant API v1)
- [x] **YouTube** — channel stats, video performance, public search (Data API v3)
- [x] **AI agent skills** — OpenClaw-compatible skills for all services

See [ROADMAP.md](ROADMAP.md) for what's next.

## License

Apache 2.0
