---
name: gmp-psi
version: 1.0.0
description: "PageSpeed Insights: Lighthouse scores and Core Web Vitals (lab + real-user CrUX data) for any URL."
metadata:
  openclaw:
    category: "seo"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp psi analyze --help"
---

# psi (PageSpeed Insights API)

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for global flags and output formats. Auth is independent of `gmp auth login` -- see below.

```bash
gmp psi analyze <url> [flags]
```

Unlike every other `gmp` command, `psi` doesn't need `gmp auth login` -- it's a public Google API keyed by an API key, not OAuth.

## Auth

```bash
# Set once
export GOOGLE_API_KEY=AIza...   # APIs & Services > Credentials, PageSpeed Insights API enabled

# Or pass per-call
gmp psi analyze https://example.com --key AIza...
```

Works without a key too, at a much lower unauthenticated rate limit -- fine for occasional one-off checks, not for scripted/repeated use.

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `<url>` (argument) | Yes | -- | URL to analyze |
| `--strategy <s>` | No | `mobile` | `mobile` or `desktop` |
| `--category <list>` | No | `performance` | Comma-separated: `performance`, `accessibility`, `best-practices`, `seo`, `pwa` |
| `--locale <l>` | No | `en` | Locale for formatted strings, e.g. `pt-BR` |
| `--key <k>` | No | `$GOOGLE_API_KEY` | API key |
| `-f, --format <fmt>` | No | `table` | Output format: json, table, csv |

## Examples

```bash
# Default: mobile, performance only
gmp psi analyze https://example.com

# Desktop, all categories
gmp psi analyze https://example.com --strategy desktop --category performance,accessibility,best-practices,seo

# Full raw Lighthouse + CrUX JSON
gmp psi analyze https://example.com -f json

# Portuguese locale
gmp psi analyze https://example.com --locale pt-BR
```

## Output

With `-f table` (default), prints up to three separate tables:

1. **Scores** -- one row per requested category (`performance`, `seo`, etc.), each scored 0-100 with a `(good)`/`(needs improvement)`/`(poor)` label.
2. **Lighthouse Metrics** -- lab data: `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `cumulative-layout-shift`, `speed-index`, `interactive`, `interaction-to-next-paint`.
3. **Field Data (CrUX)** -- real-user data, only present if Chrome UX Report has enough traffic for this URL: FCP, LCP, FID, CLS, INP, TTFB at the 75th percentile, plus an overall category.

`-f json` returns the complete raw API response (`lighthouseResult`, `loadingExperience`, `originLoadingExperience`) instead of the three tables.

## Tips

- **Lab data (Lighthouse) vs field data (CrUX) are different things.** Lighthouse runs a single simulated load at request time; CrUX aggregates real Chrome users over the past 28 days. A page can score well in Lighthouse and poorly in CrUX (or vice versa) -- CrUX is what actually affects Google's Core Web Vitals ranking signal.
- If the "Field Data (CrUX)" table is missing, the URL doesn't have enough real-user Chrome traffic to report on -- common for low-traffic or very new pages. `originLoadingExperience` in the raw JSON may still have origin-level (not page-level) CrUX data.
- `--strategy mobile` and `--strategy desktop` can score very differently for the same URL -- always check both if you're diagnosing a reported Core Web Vitals issue, since Search Console's Core Web Vitals report is mobile-first.
- Run this alongside `gmp gsc inspect` when diagnosing an indexing/ranking issue -- PSI explains *why* a page might be penalized, GSC confirms *whether* it actually is.

## See Also

- [gmp-shared](../gmp-shared/SKILL.md) -- Global flags and output formats
- [gmp-gsc](../gmp-gsc/SKILL.md) -- Search Console (indexation, search analytics)
