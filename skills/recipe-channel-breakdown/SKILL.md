---
name: recipe-channel-breakdown
version: 1.0.0
description: "Break down traffic by channel: organic, paid, social, direct, referral, and email."
metadata:
  openclaw:
    category: "recipe"
    domain: "analytics"
    requires:
      bins: ["gmp"]
      skills: ["gmp-ga"]
---

# Channel Breakdown

> **PREREQUISITE:** Load the following skills to execute this recipe: `gmp-ga`

Break down traffic by acquisition channel to understand where users come from.

## Steps

1. Sessions by channel: `gmp ga report -p PROPERTY_ID -m sessions,activeUsers,conversions -d sessionDefaultChannelGroup -r 30d -f table`
2. Source/medium detail: `gmp ga report -p PROPERTY_ID -m sessions,activeUsers -d sessionSource,sessionMedium -r 30d -l 20 -f table`
3. Compare to previous period: `gmp ga report -p PROPERTY_ID -m sessions -d sessionDefaultChannelGroup -r 60d..31d -f table`
