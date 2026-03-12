---
name: recipe-url-indexation-check
version: 1.0.0
description: "Recipe: Check URL indexation status and diagnose crawl issues via GSC."
metadata:
  openclaw:
    category: "seo"
    requires:
      bins: ["gmp"]
---

# URL Indexation Check

> Inspect specific URLs to verify they're indexed and diagnose crawl problems.

## Prerequisites

- `gmp auth login` completed
- Know your site URL (run `gmp gsc sites` to list)

## Workflow

### Step 1: Inspect a URL

```bash
gmp gsc inspect -u "https://example.com/your-page" -s "https://example.com/"
```

### Step 2: Read the results

| Field | What it means |
|-------|---------------|
| `verdict` | PASS = indexed, NEUTRAL = not enough data, FAIL = not indexed |
| `coverageState` | Why it's indexed or not (e.g. "Submitted and indexed", "Crawled - currently not indexed") |
| `indexingState` | INDEXING_ALLOWED or INDEXING_NOT_ALLOWED |
| `pageFetchState` | SUCCESSFUL, SOFT_404, REDIRECT, etc. |
| `crawledAs` | DESKTOP or MOBILE |
| `lastCrawlTime` | When Google last crawled the page |

### Step 3: Check sitemaps

```bash
gmp gsc sitemaps -s "https://example.com/"
```

Verify your pages are in a submitted sitemap with no errors.

## Common issues

- **"Crawled - currently not indexed"**: Content quality issue. Improve the page or consolidate with similar content.
- **"Discovered - currently not indexed"**: Google knows about it but hasn't prioritized crawling. Check internal links.
- **pageFetchState = SOFT_404**: Page returns 200 but Google thinks it's a 404. Add meaningful content.
- **indexingState = INDEXING_NOT_ALLOWED**: Check for `noindex` meta tag or X-Robots-Tag header.
