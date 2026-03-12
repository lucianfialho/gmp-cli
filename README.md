# gmp-cli

A CLI for the Google Marketing Platform — GA4, Search Console, Google Ads, and Tag Manager.

Built for AI agents and power users. Pipe JSON output to `jq`, feed it to Claude, or use it in shell scripts.

## Install

```bash
git clone https://github.com/lucianfialho/gmp-cli.git
cd gmp-cli
npm install
npm run build
npm link
```

## Authentication

```bash
# Browser-based OAuth (opens your default browser)
gmp auth login

# Check status
gmp auth status

# Use your own OAuth credentials (optional)
gmp auth set-credentials --client-id YOUR_ID --client-secret YOUR_SECRET

# Logout
gmp auth logout
```

Tokens are stored in `~/.config/gmp-cli/tokens.json` and auto-refresh.

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

## Output Formats

All commands support `-f` / `--format`:

| Format | Description |
|--------|-------------|
| `json` | JSON (default) — best for piping to `jq` or AI agents |
| `table` | Human-readable table |
| `csv` | CSV — pipe to file or other tools |

## Roadmap

- [ ] Google Search Console (`gmp gsc`)
- [ ] Google Tag Manager (`gmp gtm`)
- [ ] Google Ads (`gmp ads`)
- [ ] `npm` global package

## License

ISC
