---
name: recipe-landing-page-performance
version: 1.0.0
description: "Analyze landing page performance: sessions, bounce rate, and conversions by entry page."
metadata:
  openclaw:
    category: "recipe"
    domain: "analytics"
    requires:
      bins: ["gmp"]
      skills: ["gmp-ga"]
---

# Landing Page Performance

> **PREREQUISITE:** Load the following skills to execute this recipe: `gmp-ga`

Analyze which landing pages attract the most traffic and convert best.

## Steps

1. Top landing pages: `gmp ga report -p PROPERTY_ID -m sessions,bounceRate,averageSessionDuration,conversions -d landingPage -r 30d -l 20 -f table`
2. Landing pages by channel: `gmp ga report -p PROPERTY_ID -m sessions -d landingPage,sessionDefaultChannelGroup -r 30d -l 30 -f table`
3. Landing pages by device: `gmp ga report -p PROPERTY_ID -m sessions,bounceRate -d landingPage,deviceCategory -r 30d -l 30 -f table`
