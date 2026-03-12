---
name: recipe-ads-spend-overview
version: 1.0.0
description: "Recipe: Google Ads spend overview — campaigns, top keywords, search terms analysis."
metadata:
  openclaw:
    category: "advertising"
    requires:
      bins: ["gmp"]
---

# Ads Spend Overview

> Get a complete picture of your Google Ads spend: campaigns, keywords, and actual search terms.

## Prerequisites

- `gmp auth login` completed
- Developer token set: `gmp auth set-developer-token YOUR_TOKEN`
- Know your customer ID (run `gmp ads accounts`)

## Workflow

### Step 1: List accounts

```bash
gmp ads accounts
```

### Step 2: Campaign overview

```bash
gmp ads campaigns -c CUSTOMER_ID -r LAST_30_DAYS -f table
```

Look at: total cost, conversions, CTR, and cost per click across campaigns.

### Step 3: Top keywords by spend

```bash
gmp ads keywords -c CUSTOMER_ID -l 20 -f table
```

Check quality scores — low quality score keywords are costing more than they should.

### Step 4: Actual search terms

```bash
gmp ads search-terms -c CUSTOMER_ID -l 30 -f table
```

Find irrelevant search terms that are wasting budget.

### Step 5: Drill into a specific campaign

```bash
gmp ads adgroups -c CUSTOMER_ID --campaign "Campaign Name" -f table
gmp ads keywords -c CUSTOMER_ID --campaign "Campaign Name" -f table
gmp ads search-terms -c CUSTOMER_ID --campaign "Campaign Name" -f table
```

### Step 6: Custom analysis with GAQL

```bash
gmp ads query -c CUSTOMER_ID -q "SELECT campaign.name, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE segments.date DURING LAST_7_DAYS ORDER BY metrics.cost_micros DESC LIMIT 10"
```

## What to look for

- **High cost, low conversions**: Campaigns burning budget without results.
- **Low quality score keywords**: Improve ad relevance and landing pages.
- **Irrelevant search terms**: Add as negative keywords.
- **High CPC campaigns**: Consider bid adjustments or alternative targeting.
