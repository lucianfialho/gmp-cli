---
name: recipe-compare-periods
version: 1.0.0
description: "Compare traffic metrics between two time periods to spot trends and changes."
metadata:
  openclaw:
    category: "recipe"
    domain: "analytics"
    requires:
      bins: ["gmp"]
      skills: ["gmp-ga"]
---

# Compare Periods

> **PREREQUISITE:** Load the following skills to execute this recipe: `gmp-ga`

Compare traffic metrics between two time periods to identify trends, growth, or drops.

## Steps

1. This week vs last week:
   - This week: `gmp ga report -p PROPERTY_ID -m sessions,activeUsers,screenPageViews -r 7d -f table`
   - Last week: `gmp ga report -p PROPERTY_ID -m sessions,activeUsers,screenPageViews -r 14d..8d -f table`

2. This month vs last month:
   - This month: `gmp ga report -p PROPERTY_ID -m sessions,activeUsers,conversions -r 30d -f table`
   - Last month: `gmp ga report -p PROPERTY_ID -m sessions,activeUsers,conversions -r 60d..31d -f table`

3. Year over year (custom dates):
   - This year: `gmp ga report -p PROPERTY_ID -m sessions -d date -r 2025-01-01..2025-01-31 -f csv > jan2025.csv`
   - Last year: `gmp ga report -p PROPERTY_ID -m sessions -d date -r 2024-01-01..2024-01-31 -f csv > jan2024.csv`
