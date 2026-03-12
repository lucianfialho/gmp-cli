# gmp-cli

A CLI for the Google Marketing Platform — GA4, Search Console, Google Ads, and Tag Manager.

Built for AI agents (Gemini CLI, Claude Code) and power users. Pipe JSON output to `jq`, feed it to your agent, or use it in shell scripts.

## Install

```bash
git clone https://github.com/lucianfialho/gmp-cli.git
cd gmp-cli
npm install
npm run build
npm link
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

### List published versions

```bash
gmp gtm versions -p accounts/X/containers/Y -f table
```

## Output Formats

All commands support `-f` / `--format`:

| Format | Description |
|--------|-------------|
| `json` | JSON (default) — best for piping to `jq` or AI agents |
| `table` | Human-readable table |
| `csv` | CSV — pipe to file or other tools |

## Roadmap

- [x] Google Analytics — `gmp ga`
- [x] Google Search Console — `gmp gsc`
- [x] Google Ads — `gmp ads`
- [x] Google Tag Manager — `gmp gtm`
- [ ] `npm` global package
- [ ] Default property/account config

See [ROADMAP.md](ROADMAP.md) for the full plan.

## License

Apache 2.0
