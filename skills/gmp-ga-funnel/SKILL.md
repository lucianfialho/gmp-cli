---
name: gmp-ga-funnel
version: 1.0.0
description: "GA4: Run funnel reports (GA4 Data API v1alpha runFunnelReport)."
metadata:
  openclaw:
    category: "analytics"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp ga funnel --help"
---

# ga funnel

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth, global flags, and output formats.

Run a GA4 funnel report: visualize how users move through a sequence of steps and where they drop off. Calls `runFunnelReport` on the GA4 Data API v1alpha directly over REST, since the underlying client library doesn't expose this method yet -- it needs no scope beyond the default `analytics.readonly`.

## Usage

```bash
gmp ga funnel -p <PROPERTY_ID> --steps '<json>' [flags]
```

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `-p, --property <id>` | No* | -- | GA4 property ID (numeric) |
| `--steps <json>` | Yes | -- | JSON array of funnel steps (see below) |
| `-r, --date-range <range>` | No | `30d` | Date range: `30d`, `7d`, `2024-01-01..2024-01-31` |
| `--type <type>` | No | `standard` | Visualization type: `standard` (no date column) or `trended` (adds a date column) |
| `--open` | No | `false` | Open funnel -- users may enter at any step, not just the first |
| `--breakdown <dimension>` | No | -- | Add a dimension column breaking down each step (e.g. `deviceCategory`) |
| `--limit <n>` | No | `10000` | Row limit |
| `--report <which>` | No | `table` | Which sub-report to show for `table`/`csv`: `table` or `visualization` |
| `-f, --format <fmt>` | No | `table` | Output format: json, table, csv |

\* Falls back to `gmp config set property`. See `../gmp-shared/SKILL.md`.

## Step Format

Each step needs a `name` and either `eventName` (the common case) or a raw `filter` expression (for AND/OR/metric conditions beyond a single event name):

```json
[
  {"name": "View", "eventName": "page_view"},
  {"name": "Add to cart", "eventName": "add_to_cart"},
  {"name": "Purchase", "eventName": "purchase"}
]
```

## Examples

```bash
# Simple 3-step funnel
gmp ga funnel -p 123456789 --steps '[{"name":"View","eventName":"page_view"},{"name":"Add to cart","eventName":"add_to_cart"},{"name":"Purchase","eventName":"purchase"}]' -r 30d -f table

# Trended (shows the funnel changing day by day)
gmp ga funnel -p 123456789 --steps '[{"name":"View","eventName":"page_view"},{"name":"Purchase","eventName":"purchase"}]' --type trended --report visualization -r 14d -f table

# Breakdown by device
gmp ga funnel -p 123456789 --steps '[{"name":"View","eventName":"page_view"},{"name":"Purchase","eventName":"purchase"}]' --breakdown deviceCategory -f table

# Open funnel (users can enter at step 2 directly)
gmp ga funnel -p 123456789 --steps '[{"name":"Add to cart","eventName":"add_to_cart"},{"name":"Purchase","eventName":"purchase"}]' --open -f table

# Full JSON response (both sub-reports: funnelTable and funnelVisualization)
gmp ga funnel -p 123456789 --steps '[{"name":"View","eventName":"page_view"},{"name":"Purchase","eventName":"purchase"}]' -f json
```

## Output

The `table`/`csv` columns depend on `--report`:
- `table` (default): `funnelStepName`, `activeUsers`, `funnelStepCompletionRate`, `funnelStepAbandonments`, `funnelStepAbandonmentRate`, plus a breakdown column if `--breakdown` is set.
- `visualization`: `funnelStepName`, `activeUsers`, plus `date` if `--type trended`.

## Tips

- This is a GA4 "alpha stability" endpoint per Google's own docs -- syntax may change. It currently returns `metricHeaders`/`dimensionHeaders` doubled relative to the actual row values; the CLI already dedupes this before display, so you won't see it, but don't be surprised if raw API responses elsewhere show it.
- `isDirectlyFollowedBy` and `withinDurationFromPriorStep` can be added per step in `--steps` JSON (not shown above) to require steps happen back-to-back or within a time window.
- For unsampled, historical (>beyond the Data API's retention), or fully custom-SQL funnels, use the [`recipe-ga4-funnel-bq`](../recipe-ga4-funnel-bq/SKILL.md) recipe instead.

## See Also

- [gmp-ga](../gmp-ga/SKILL.md) -- All GA4 commands
- [gmp-shared](../gmp-shared/SKILL.md) -- Global flags and auth
