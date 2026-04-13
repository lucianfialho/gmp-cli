---
name: gmp-bq-query
version: 1.0.0
description: "BigQuery: Run pre-built query templates against GMP export datasets."
metadata:
  openclaw:
    category: "analytics"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp bq query --help"
---

# bq query

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth and `../gmp-bq/SKILL.md` for BQ overview.

Run a pre-built query template against a BigQuery dataset containing GMP export data.

## Usage

```bash
gmp bq query -t <template-name> --project <gcp-project> --dataset <dataset> [flags]
```

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `-t, --template <name>` | Yes | -- | Template name (use `gmp bq templates` to list) |
| `--project <id>` | Yes | -- | GCP project ID |
| `--dataset <name>` | Yes | -- | BigQuery dataset name |
| `-r, --date-range <range>` | No | `30d` | Date range: `30d`, `7d`, `2024-01-01..2024-03-31` |
| `-f, --format <fmt>` | No | `json` | Output format: json, table, csv |

## Template Parameters

All templates accept the same four parameters, populated automatically:

| Parameter | Source |
|-----------|--------|
| `{{project}}` | `--project` flag |
| `{{dataset}}` | `--dataset` flag |
| `{{start_date}}` | Computed from `--date-range` |
| `{{end_date}}` | Computed from `--date-range` |

## Examples

```bash
# GA4: Flatten events from last 30 days
gmp bq query -t ga4-events-flat --project my-gcp-project --dataset analytics_123456789

# GA4: Funnel analysis for last 90 days
gmp bq query -t ga4-funnel --project my-gcp-project --dataset analytics_123456789 -r 90d -f table

# GA4: Attribution report for Q1 2024
gmp bq query -t ga4-attribution --project my-gcp-project --dataset analytics_123456789 -r 2024-01-01..2024-03-31

# Ads: Find wasted spend in last 30 days
gmp bq query -t ads-wasted-spend --project my-gcp-project --dataset my_ads_data -r 30d -f table

# GSC: Top pages for last 90 days
gmp bq query -t gsc-top-pages --project my-gcp-project --dataset searchconsole -r 90d -f csv > pages.csv

# GSC: Detect keyword cannibalization
gmp bq query -t gsc-cannibalization --project my-gcp-project --dataset searchconsole -r 90d -f table
```

## Output

All templates return tabular data compatible with `formatOutput` (json, table, csv). Each template produces different columns — run with `-f json` to see the full field list.

## Tips

- Use `gmp bq templates --service ga4` to see only GA4 templates.
- Use `gmp bq explore --project X --dataset Y` to discover available tables before running queries.
- GA4 dataset names follow the pattern `analytics_<PROPERTY_ID>`.
- Pipe JSON output to `jq` for filtering: `gmp bq query ... | jq '[.[] | select(.clicks > 100)]'`
- Export to CSV for spreadsheet analysis: `gmp bq query ... -f csv > report.csv`

## See Also

- [gmp-bq](../gmp-bq/SKILL.md) -- All BQ commands
- [gmp-shared](../gmp-shared/SKILL.md) -- Global flags and auth
