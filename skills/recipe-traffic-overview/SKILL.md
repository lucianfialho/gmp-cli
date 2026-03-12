---
name: recipe-traffic-overview
version: 1.0.0
description: "Get a complete traffic overview: sessions, users, pageviews, and trends."
metadata:
  openclaw:
    category: "recipe"
    domain: "analytics"
    requires:
      bins: ["gmp"]
      skills: ["gmp-ga"]
---

# Traffic Overview

> **PREREQUISITE:** Load the following skills to execute this recipe: `gmp-ga`

Get a complete traffic overview with sessions, users, pageviews, and daily trends.

## Steps

1. Get aggregate totals: `gmp ga report -p PROPERTY_ID -m sessions,activeUsers,screenPageViews,averageSessionDuration -r 30d -f table`
2. Get daily trend: `gmp ga report -p PROPERTY_ID -m sessions,activeUsers -d date -r 30d -f table`
3. Get device breakdown: `gmp ga report -p PROPERTY_ID -m sessions -d deviceCategory -r 30d -f table`
4. Check realtime: `gmp ga realtime -p PROPERTY_ID -m activeUsers -f table`
