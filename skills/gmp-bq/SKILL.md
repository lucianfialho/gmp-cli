---
name: gmp-bq
version: 1.0.0
description: "BigQuery: Query GMP export data (GA4, Ads, GSC) with pre-built templates and custom SQL."
metadata:
  openclaw:
    category: "analytics"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp bq --help"
---

# bq (BigQuery API v2)

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth, global flags, and output formats.
>
> **EXTRA AUTH:** BigQuery requires the `bigquery.readonly` scope. If you authenticated before this feature was added, run `gmp auth login` again to grant the new scope.

```bash
gmp bq <command> [flags]
```

## Commands

| Command | Description |
|---------|-------------|
| [`templates`](#templates) | List available pre-built query templates |
| [`query`](../gmp-bq-query/SKILL.md) | Run a pre-built query template |
| `explore` | List tables and schema in a BigQuery dataset |
| `custom` | Run a custom SQL query |

## Quick Reference

### List all templates

```bash
gmp bq templates
gmp bq templates --service ga4 -f table
gmp bq templates --service ads -f json
gmp bq templates --service gsc
```

### Run a template

```bash
gmp bq query -t ga4-events-flat --project my-project --dataset analytics_123456789 -r 30d
gmp bq query -t ads-wasted-spend --project my-project --dataset my_ads_dataset -r 90d -f table
gmp bq query -t gsc-top-pages --project my-project --dataset searchconsole -r 2024-01-01..2024-03-31
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
gmp bq custom --project my-project -q "SELECT event_date, COUNT(*) FROM \`my-project.analytics_123456789.events_20240101\` GROUP BY event_date"
```

## Available Templates

### GA4 (6 templates)

| Template | Description |
|----------|-------------|
| `ga4-events-flat` | Flatten nested `event_params` into columns |
| `ga4-funnel` | Funnel analysis from event sequences |
| `ga4-attribution` | Multi-touch attribution (source/medium per session) |
| `ga4-user-journey` | Session-level page paths |
| `ga4-ecommerce` | Purchase/revenue with product-level detail |
| `ga4-retention` | Weekly cohort retention from first visit |

### Google Ads (3 templates)

| Template | Description |
|----------|-------------|
| `ads-wasted-spend` | Search terms with spend and zero conversions |
| `ads-quality-trend` | Keyword quality score over time |
| `ads-cross-campaign` | Cross-campaign performance comparison |

### GSC (3 templates)

| Template | Description |
|----------|-------------|
| `gsc-top-pages` | Top pages by clicks with CTR/position |
| `gsc-query-clusters` | Top queries by volume (excludes anonymized) |
| `gsc-cannibalization` | Queries with multiple competing pages |

## Date Range Formats

| Format | Example | Description |
|--------|---------|-------------|
| Relative | `30d`, `7d`, `90d` | Last N days |
| Keywords | `today`, `yesterday` | Single day |
| Absolute | `2024-01-01..2024-03-31` | Custom range |

Dates are converted to `YYYYMMDD` format for GA4 `_TABLE_SUFFIX` and to `YYYY-MM-DD` for GSC/Ads `_DATA_DATE` partitions.

## Tips

- Use `gmp bq explore` first to discover what tables/datasets are available.
- GA4 datasets are typically named `analytics_<PROPERTY_ID>`.
- GSC bulk export datasets contain `searchdata_site_impression` and `searchdata_url_impression` tables.
- Google Ads transfer datasets contain tables like `ads_Campaign_<CUSTOMER_ID>`, `ads_CampaignBasicStats_<CUSTOMER_ID>`, etc.
- Default output is JSON -- use `-f table` for human-readable output.
- BigQuery queries have processing costs -- use `LIMIT` and date ranges to control scan size.
