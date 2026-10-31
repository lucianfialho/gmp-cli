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

Compare traffic metrics between two time periods to identify trends, growth, or drops. `ga report` does this natively with `--compare` -- one API call, correct date math, current/previous rows already in the response. Prefer it over running two separate reports and diffing by hand.

## Steps

1. This week vs the equal-length prior week:
   `gmp ga report -p PROPERTY_ID -m sessions,activeUsers,screenPageViews -r 7d --compare previous_period -f table`

2. This month (last 30 days) vs the prior 30 days:
   `gmp ga report -p PROPERTY_ID -m sessions,activeUsers,conversions -r 30d --compare previous_period -f table`

3. Year over year, same dates:
   `gmp ga report -p PROPERTY_ID -m sessions -r 2025-01-01..2025-01-31 --compare previous_year -f table`

4. Break a comparison down by dimension (e.g. by channel) -- `--compare` composes with `-d`:
   `gmp ga report -p PROPERTY_ID -m sessions -d sessionDefaultChannelGroup -r 30d --compare previous_period -f table`

The output includes an implicit `dateRange` column (`current`/`previous`) distinguishing the two periods -- no need to request it as a dimension.

## When to fall back to two separate calls

`--compare` only supports `previous_period` (equal-length preceding window) and `previous_year` (same dates, one year back). For an arbitrary non-adjacent comparison (e.g. this quarter vs a specific quarter two years ago that isn't exactly "previous year"), run two reports with explicit `-r start..end` ranges and diff the results yourself -- `gsc report` and the `ads` reports also have no native compare support and always need this two-call approach.
