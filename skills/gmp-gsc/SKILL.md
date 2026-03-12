---
name: gmp-gsc
version: 1.0.0
description: "Google Search Console: Search analytics, URL inspection, sitemaps, and site management."
metadata:
  openclaw:
    category: "seo"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp gsc --help"
---

# gsc (Google Search Console API)

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth, global flags, and output formats.

```bash
gmp gsc <command> [flags]
```

## Commands

| Command | Description |
|---------|-------------|
| [`report`](../gmp-gsc-report/SKILL.md) | Search analytics report (clicks, impressions, CTR, position) |
| `sites` | List verified sites |
| `inspect` | Check URL indexation status |
| `sitemaps` | List sitemaps for a site |

## Quick Reference

### List verified sites

```bash
gmp gsc sites
gmp gsc sites -f json
```

### URL inspection

```bash
gmp gsc inspect -u "https://example.com/page" -s "https://example.com/"
```

Returns: verdict, coverage state, indexing state, last crawl time, page fetch state, crawled as (mobile/desktop).

### List sitemaps

```bash
gmp gsc sitemaps -s "https://example.com/"
```

Returns: path, type, last submitted, last downloaded, warnings, errors.

## Tips

- Site URLs must match exactly how they appear in Search Console (including trailing slash).
- Use `sc-domain:example.com` for domain properties.
- GSC data has a ~3 day lag -- the most recent data available is typically 3 days old.
- Default output is JSON -- use `-f table` for human-readable output.
