---
name: recipe-top-pages
version: 1.0.0
description: "Find the most visited pages and their engagement metrics."
metadata:
  openclaw:
    category: "recipe"
    domain: "analytics"
    requires:
      bins: ["gmp"]
      skills: ["gmp-ga"]
---

# Top Pages Report

> **PREREQUISITE:** Load the following skills to execute this recipe: `gmp-ga`

Find the most visited pages and their engagement metrics.

## Steps

1. Top pages by views: `gmp ga report -p PROPERTY_ID -m screenPageViews,sessions,activeUsers -d pagePath -r 30d -l 20 -f table`
2. Top pages by engagement: `gmp ga report -p PROPERTY_ID -m averageSessionDuration,bounceRate,screenPageViews -d pagePath -r 30d -l 20 -f table`
3. Filter specific section: `gmp ga report -p PROPERTY_ID -m screenPageViews -d pagePath -r 30d --filter "pagePath==/blog" -f table`
