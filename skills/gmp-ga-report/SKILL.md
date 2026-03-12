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
| `-p, --property <id>` | Yes | -- | GA4 property ID (numeric) |
| `-m, --metrics <list>` | Yes | -- | Comma-separated metrics |
| `-d, --dimensions <list>` | No | -- | Comma-separated dimensions |
| `-r, --date-range <range>` | No | `30d` | Date range: `30d`, `7d`, `yesterday`, `2024-01-01..2024-01-31` |
| `-l, --limit <n>` | No | `10000` | Row limit |
| `--filter <expr>` | No | -- | Dimension filter (`fieldName==value`) |
| `-f, --format <fmt>` | No | `json` | Output format: json, table, csv |

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
- Pipe JSON output to `jq` for filtering: `gmp ga report ... | jq '.[0:5]'`
- Export to CSV for spreadsheet analysis: `gmp ga report ... -f csv > report.csv`

## See Also

- [gmp-shared](../gmp-shared/SKILL.md) -- Global flags and auth
- [gmp-ga](../gmp-ga/SKILL.md) -- All GA4 commands
