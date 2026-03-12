---
name: recipe-realtime-monitor
version: 1.0.0
description: "Monitor live traffic: active users, top pages, and traffic sources in realtime."
metadata:
  openclaw:
    category: "recipe"
    domain: "analytics"
    requires:
      bins: ["gmp"]
      skills: ["gmp-ga"]
---

# Realtime Traffic Monitor

> **PREREQUISITE:** Load the following skills to execute this recipe: `gmp-ga`

Monitor live traffic on your site: active users, current pages, and traffic sources.

## Steps

1. Active users now: `gmp ga realtime -p PROPERTY_ID -m activeUsers -f table`
2. Active users by page: `gmp ga realtime -p PROPERTY_ID -m activeUsers -d unifiedScreenName -f table`
3. Active users by country: `gmp ga realtime -p PROPERTY_ID -m activeUsers -d country -f table`
4. Active users by source: `gmp ga realtime -p PROPERTY_ID -m activeUsers -d sessionSource -f table`
