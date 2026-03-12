---
name: recipe-seo-query-analysis
version: 1.0.0
description: "Recipe: Analyze top search queries from GSC — impressions, clicks, CTR, position."
metadata:
  openclaw:
    category: "seo"
    requires:
      bins: ["gmp"]
---

# SEO Query Analysis

> Analyze your site's search performance: top queries, CTR opportunities, and position insights.

## Prerequisites

- `gmp auth login` completed
- Know your site URL (run `gmp gsc sites` to list)

## Workflow

### Step 1: Get top queries

```bash
gmp gsc report -s "SITE_URL" -d query -l 50 -f table
```

### Step 2: Find low-CTR opportunities (high impressions, low clicks)

```bash
gmp gsc report -s "SITE_URL" -d query -l 100 -f json | jq '[.[] | select((.impressions | tonumber) > 100 and (.ctr | rtrimstr("%") | tonumber) < 2)]'
```

These are queries where you rank but users aren't clicking — title/description optimization candidates.

### Step 3: Queries by page

```bash
gmp gsc report -s "SITE_URL" -d query,page -l 50 --page "/blog" -f table
```

### Step 4: Track query trends over time

```bash
gmp gsc report -s "SITE_URL" -d query,date -r 28d --query "your keyword" -f table
```

## What to look for

- **High impressions, low CTR**: Improve title tags and meta descriptions.
- **Position 5-15**: Close to page 1 — content optimization can push these up.
- **Declining trends**: Queries losing position over time need attention.
- **Query-page mismatch**: If the wrong page ranks for a query, consider internal linking or content consolidation.
