---
name: gmp-gsc-report
version: 1.0.0
description: "GSC: Search analytics reports with dimensions, filters, and date ranges."
metadata:
  openclaw:
    category: "seo"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp gsc report --help"
---

# gsc report

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth, global flags, and output formats.

Run a Search Console analytics report with dimensions, filters, and date ranges.

## Usage

```bash
gmp gsc report -s <SITE_URL> [flags]
```

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `-s, --site <url>` | Yes | -- | Site URL (e.g. `https://example.com/` or `sc-domain:example.com`) |
| `-d, --dimensions <list>` | No | -- | Comma-separated: query, page, country, device, date, searchAppearance |
| `-r, --date-range <range>` | No | `28d` | Date range: `28d`, `90d`, `2024-01-01..2024-01-31` |
| `-l, --limit <n>` | No | `25` | Row limit |
| `--query <q>` | No | -- | Filter by query (contains) |
| `--page <p>` | No | -- | Filter by page URL (contains) |
| `--type <t>` | No | `web` | Search type: web, image, video, news, discover, googleNews |
| `-f, --format <fmt>` | No | `json` | Output format: json, table, csv |

## Output Columns

Every row includes these metrics:

| Column | Description |
|--------|-------------|
| `clicks` | Number of clicks |
| `impressions` | Number of impressions |
| `ctr` | Click-through rate (formatted as percentage) |
| `position` | Average position (1 decimal) |

## Available Dimensions

| Dimension | Description |
|-----------|-------------|
| `query` | Search query |
| `page` | Page URL |
| `country` | Country code (ISO 3166-1 alpha-3) |
| `device` | Device type: DESKTOP, MOBILE, TABLET |
| `date` | Date (YYYY-MM-DD) |
| `searchAppearance` | Search appearance type |

## Examples

```bash
# Top queries, last 28 days
gmp gsc report -s "https://example.com/" -d query -l 10 -f table

# Pages with most clicks
gmp gsc report -s "https://example.com/" -d page -l 10 -f table

# Queries by date
gmp gsc report -s "https://example.com/" -d query,date -r 7d -f table

# Filter by query keyword
gmp gsc report -s "https://example.com/" -d query --query "your keyword" -f table

# Filter by page path
gmp gsc report -s "https://example.com/" -d query --page "/blog" -f table

# Custom date range
gmp gsc report -s "https://example.com/" -d query -r 2024-01-01..2024-01-31

# Export to CSV
gmp gsc report -s "https://example.com/" -d query,page -f csv > gsc-report.csv
```

## Tips

- GSC data has a ~3 day lag. The CLI automatically adjusts date ranges to account for this.
- Default date range is 28 days (GSC standard).
- Combine dimensions for cross-analysis: `-d query,page` shows which queries lead to which pages.
- Use `--query` and `--page` filters to narrow results without downloading everything.
- Pipe JSON output to `jq` for filtering: `gmp gsc report ... | jq '[.[] | select(.clicks > 10)]'`

## See Also

- [gmp-shared](../gmp-shared/SKILL.md) -- Global flags and auth
- [gmp-gsc](../gmp-gsc/SKILL.md) -- All GSC commands
