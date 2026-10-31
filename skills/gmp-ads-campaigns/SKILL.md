---
name: gmp-ads-campaigns
version: 1.0.0
description: "Google Ads: Campaign performance reports with date ranges and status filters."
metadata:
  openclaw:
    category: "advertising"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp ads campaigns --help"
---

# ads campaigns

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth and `../gmp-ads/SKILL.md` for Ads-specific setup.

Campaign performance report with metrics like impressions, clicks, cost, conversions, and CTR.

## Usage

```bash
gmp ads campaigns -c <CUSTOMER_ID> [flags]
```

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `-c, --customer-id <id>` | Yes | -- | Google Ads customer ID |
| `-r, --date-range <range>` | No | `LAST_30_DAYS` | Date range constant |
| `--status <s>` | No | -- | Filter: ENABLED, PAUSED, REMOVED |
| `-l, --limit <n>` | No | `50` | Row limit |
| `--sort <field>` | No | -- | `impressions`, `clicks`, `cost`, `conversions`, `convValue`, `ctr`, `avgCpc` |
| `--order <dir>` | No | `desc` | Sort direction: `asc`, `desc` |
| `-f, --format <fmt>` | No | `json` | Output format: json, table, csv |

## Output Columns

| Column | Description |
|--------|-------------|
| `campaign` | Campaign name |
| `status` | ENABLED, PAUSED, REMOVED |
| `type` | Channel type (SEARCH, DISPLAY, VIDEO, etc.) |
| `impressions` | Total impressions |
| `clicks` | Total clicks |
| `cost` | Total cost (converted from micros) |
| `conversions` | Total conversions |
| `convValue` | Total conversion value |
| `ctr` | Click-through rate (percentage) |
| `avgCpc` | Average cost per click (converted from micros) |

## Examples

```bash
# All campaigns, last 30 days
gmp ads campaigns -c 1234567890 -f table

# Only enabled campaigns
gmp ads campaigns -c 1234567890 --status ENABLED -f table

# Last 7 days
gmp ads campaigns -c 1234567890 -r LAST_7_DAYS -f table

# Export to CSV
gmp ads campaigns -c 1234567890 -f csv > campaigns.csv

# Top 5 spenders (server-side ORDER BY, no jq needed)
gmp ads campaigns -c 1234567890 --sort cost --order desc -l 5 -f table

# Highest CTR first
gmp ads campaigns -c 1234567890 --sort ctr -f table
```

## See Also

- [gmp-ads](../gmp-ads/SKILL.md) -- All Ads commands
- [gmp-shared](../gmp-shared/SKILL.md) -- Global flags and auth
