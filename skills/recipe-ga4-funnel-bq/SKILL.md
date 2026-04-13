---
name: recipe-ga4-funnel-bq
version: 1.0.0
description: "Recipe: GA4 funnel analysis via BigQuery — session_start → page_view → add_to_cart → checkout → purchase."
metadata:
  openclaw:
    category: "analytics"
    requires:
      bins: ["gmp"]
---

# Recipe: GA4 Funnel Analysis (BigQuery)

Analyze the e-commerce conversion funnel using GA4 BigQuery export data. Shows drop-off at each step: session_start → page_view → add_to_cart → begin_checkout → purchase.

## When to Use

- You need funnel analysis with unsampled data
- The GA4 Data API funnel reports are insufficient (alpha, limited)
- You need historical funnel data beyond 90 days
- You want to customize funnel steps beyond standard e-commerce events

## Prerequisites

- GA4 BigQuery export enabled for the property
- User authenticated with `gmp auth login` (bigquery.readonly scope)
- GCP project ID and dataset name

## Steps

### 1. Find the dataset

```bash
gmp bq explore --project YOUR_PROJECT --dataset analytics_YOUR_PROPERTY_ID -f table
```

### 2. Run the funnel template

```bash
gmp bq query -t ga4-funnel --project YOUR_PROJECT --dataset analytics_YOUR_PROPERTY_ID -r 30d -f table
```

### 3. Interpret results

The output shows unique session counts at each funnel step:

| step | users |
|------|-------|
| session_start | 50000 |
| page_view | 48000 |
| add_to_cart | 5000 |
| begin_checkout | 2000 |
| purchase | 800 |

Calculate drop-off rates between steps to identify friction points.

### 4. Custom funnel steps

For custom events, use `gmp bq custom`:

```bash
gmp bq custom --project YOUR_PROJECT -q "
  SELECT event_name, COUNT(DISTINCT user_pseudo_id) AS users
  FROM \`YOUR_PROJECT.analytics_PROPERTY_ID.events_*\`
  WHERE _TABLE_SUFFIX BETWEEN '20240101' AND '20240131'
    AND event_name IN ('session_start', 'sign_up', 'first_purchase', 'subscription')
  GROUP BY event_name
" -f table
```

## Tips

- Compare funnels across date ranges to spot trends
- Segment by device: add `device.category` to the GROUP BY
- Segment by country: add `geo.country` to the GROUP BY
- Use `ga4-attribution` template alongside to understand which channels drive conversions
