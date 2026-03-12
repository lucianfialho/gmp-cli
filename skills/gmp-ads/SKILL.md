---
name: gmp-ads
version: 1.0.0
description: "Google Ads: Campaigns, ad groups, keywords, search terms, and raw GAQL queries."
metadata:
  openclaw:
    category: "advertising"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp ads --help"
---

# ads (Google Ads REST API)

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth, global flags, and output formats.
>
> **EXTRA AUTH:** Google Ads requires a developer token. Set it with:
> ```bash
> gmp auth set-developer-token YOUR_TOKEN
> ```
> If using a Manager Account (MCC), also set:
> ```bash
> gmp auth set-login-customer-id 1234567890
> ```

```bash
gmp ads <command> [flags]
```

## Commands

| Command | Description |
|---------|-------------|
| `accounts` | List accessible customer accounts |
| [`campaigns`](../gmp-ads-campaigns/SKILL.md) | Campaign performance report |
| `adgroups` | Ad group performance report |
| `keywords` | Keyword performance report |
| `search-terms` | Search terms report (actual queries that triggered ads) |
| `query` | Run a raw GAQL query |

## Quick Reference

### List accounts

```bash
# Simple list (no MCC needed)
gmp ads accounts

# Detailed list via MCC
gmp ads accounts -c 1234567890 -f table
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

### Search terms

```bash
gmp ads search-terms -c 1234567890 -f table
gmp ads search-terms -c 1234567890 --campaign "Brand" -f table
```

### Raw GAQL query

```bash
gmp ads query -c 1234567890 -q "SELECT campaign.name, metrics.clicks FROM campaign WHERE segments.date DURING LAST_7_DAYS"
```

## Date Range Values

Google Ads uses predefined date range constants:

| Value | Description |
|-------|-------------|
| `LAST_7_DAYS` | Last 7 days |
| `LAST_30_DAYS` | Last 30 days (default) |
| `THIS_MONTH` | Current month |
| `LAST_MONTH` | Previous month |
| `LAST_14_DAYS` | Last 14 days |
| `LAST_BUSINESS_WEEK` | Last business week |

## Tips

- Customer IDs can include dashes (`123-456-7890`) or not (`1234567890`) -- both work.
- Costs are returned in micros and automatically converted (divided by 1,000,000).
- CTR and rates are automatically formatted as percentages.
- Use `gmp ads query` for any GAQL query not covered by built-in commands.
- GAQL reference: the query language supports SELECT, FROM, WHERE, ORDER BY, LIMIT.
