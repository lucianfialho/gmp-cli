---
name: gmp-ga-report
version: 1.0.0
description: "GA4: Run analytics reports with dimensions, metrics, filters, and date ranges."
metadata:
  openclaw:
    category: "analytics"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp ga report --help"
---

# ga report

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth, global flags, and output formats.

Run a GA4 report with dimensions, metrics, filters, and date ranges.

## Usage

```bash
gmp ga report -p <PROPERTY_ID> -m <METRICS> [flags]
```

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `-p, --property <id>` | No* | -- | GA4 property ID (numeric) |
| `-m, --metrics <list>` | Yes | -- | Comma-separated metrics |
| `-d, --dimensions <list>` | No | -- | Comma-separated dimensions |
| `-r, --date-range <range>` | No | `30d` | Date range: `30d`, `7d`, `yesterday`, `2024-01-01..2024-01-31` |
| `-l, --limit <n>` | No | `10000` | Row limit |
| `--filter <expr>` | No | -- | Dimension filter (`fieldName==value`) |
| `--sort <field>` | No | -- | Sort by a requested metric or dimension name (server-side, via the API's native `orderBys`) |
| `--order <dir>` | No | `desc` | Sort direction: `asc`, `desc` |
| `--compare <mode>` | No | -- | `previous_period` (equal-length preceding window) or `previous_year` (same dates, one year back) |
| `-f, --format <fmt>` | No | `json` | Output format: json, table, csv |

\* Falls back to `gmp config set property`. Errors with a clear message if neither is set. See `../gmp-shared/SKILL.md`.

## Date Range Formats

| Format | Example | Description |
|--------|---------|-------------|
| Relative | `30d`, `7d`, `90d` | Last N days |
| Keywords | `today`, `yesterday` | Single day |
| Absolute | `2024-01-01..2024-01-31` | Custom range |

## Examples

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

# Top 10 pages by sessions (server-side sort + limit)
gmp ga report -p 123456789 -m sessions -d pagePath --sort sessions -l 10 -f table

# This week vs the equal-length prior week, in one call
gmp ga report -p 123456789 -m sessions,activeUsers -r 7d --compare previous_period -f table

# This month vs the same month last year
gmp ga report -p 123456789 -m sessions -r 30d --compare previous_year -f table

# Relying on a stored default property (gmp config set property 123456789)
gmp ga report -m sessions -d pagePath -f table
```

## Common Metrics

| Metric | Description |
|--------|-------------|
| `sessions` | Total sessions |
| `activeUsers` | Active users |
| `screenPageViews` | Page views |
| `bounceRate` | Bounce rate |
| `averageSessionDuration` | Avg session duration |
| `conversions` | Total conversions |
| `totalRevenue` | Total revenue |

## Common Dimensions

| Dimension | Description |
|-----------|-------------|
| `pagePath` | Page path |
| `sessionDefaultChannelGroup` | Channel (Organic, Paid, etc.) |
| `country` | Country |
| `city` | City |
| `deviceCategory` | Device (desktop, mobile, tablet) |
| `date` | Date (YYYYMMDD) |
| `landingPage` | Landing page path |
| `sessionSource` | Traffic source |
| `sessionMedium` | Traffic medium |

## Tips

- Use `gmp ga metadata -p PROPERTY_ID` to discover all available metrics/dimensions.
- Use `gmp ga check` to validate combinations before running complex reports.
- `--sort` must name a metric or dimension already in `-m`/`-d` -- it errors clearly otherwise. Because sorting and `-l/--limit` both happen server-side, `--sort sessions -l 10` gives a true top-10, not a truncate-then-reorder of whatever the API returned first.
- `--compare` adds an implicit `dateRange` dimension to the output (values `current`/`previous`) -- no need to add it to `-d` yourself.
- Pipe JSON output to `jq` for filtering: `gmp ga report ... | jq '.[0:5]'`
- Export to CSV for spreadsheet analysis: `gmp ga report ... -f csv > report.csv`

## See Also

- [gmp-shared](../gmp-shared/SKILL.md) -- Global flags and auth
- [gmp-ga](../gmp-ga/SKILL.md) -- All GA4 commands
