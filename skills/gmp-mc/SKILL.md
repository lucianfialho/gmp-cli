---
name: gmp-mc
version: 1.0.0
description: "Google Merchant Center: accounts, product catalog with item-level issues, and account-level issues."
metadata:
  openclaw:
    category: "ecommerce"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp mc --help"
---

# mc (Merchant API)

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth, global flags, and output formats.

```bash
gmp mc <command> [flags]
```

## Commands

| Command | Description |
|---------|-------------|
| `accounts` | List accessible Merchant Center accounts |
| `products` | List products with status and item-level issues (paginates through the full catalog) |
| `issues` | List account-level issues |

## Quick Reference

### List accounts

```bash
gmp mc accounts -f table
```

### List products (full catalog)

```bash
# Full catalog, CSV by default (large catalogs are unwieldy as a table)
gmp mc products -a MERCHANT_ACCOUNT_ID

# Cap how many products to fetch
gmp mc products -a MERCHANT_ACCOUNT_ID -l 500 -f table

# Save the full raw API response (products + statuses) while still printing the summary
gmp mc products -a MERCHANT_ACCOUNT_ID -o raw-products.json -f table
```

### Account-level issues

```bash
gmp mc issues -a MERCHANT_ACCOUNT_ID -f table
```

## Flags

### `accounts`

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `-f, --format <fmt>` | No | `table` | Output format: json, table, csv |

### `products`

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `-a, --account <id>` | Yes | -- | Merchant Center account ID |
| `-l, --limit <n>` | No | all | Max products to fetch |
| `-o, --out <file>` | No | -- | Also save the full raw JSON (products + statuses) to this file |
| `-f, --format <fmt>` | No | `csv` | Output format: json, table, csv |

### `issues`

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `-a, --account <id>` | Yes | -- | Merchant Center account ID |
| `-f, --format <fmt>` | No | `table` | Output format: json, table, csv |

## Output Columns

### `products` (summary row)

| Column | Description |
|--------|-------------|
| `offerId` | Your product ID |
| `title` | Product title |
| `link` | Product landing page URL |
| `availability` | in stock / out of stock / etc. |
| `price` | Formatted price with currency |
| `brand` | Brand |
| `gtin` | GTIN(s), pipe-separated if multiple |
| `identifierExists` | Whether a GTIN/MPN+brand identifier is present |
| `disapproved` | `true` if disapproved in any destination/country |
| `issueCount` | Number of item-level issues |
| `issueCodes` | Issue codes, pipe-separated |
| `maxSeverity` | `DISAPPROVED`, `DEMOTED`, `NOT_IMPACTED`, or empty |

Pass `-f json` or `-o <file>` to get the full raw product + status payload (attributes beyond the summary, all destination statuses, full issue objects).

### `issues`

| Column | Description |
|--------|-------------|
| `title` | Issue title |
| `severity` | Issue severity |
| `impactedDestinations` | Reporting contexts affected, pipe-separated |
| `detail` | Issue detail text |

## Tips

- `products` always paginates through the entire catalog internally (250 products per API page) regardless of `-l` -- `-l` just caps how many are kept/printed, it doesn't reduce API calls for catalogs larger than the limit.
- Default format for `products` is `csv`, not `table` -- large catalogs render unusably wide as a table. Use `-f table` only with `-l` set to something small.
- Use `-o raw.json` when you need fields the summary doesn't surface (full `productAttributes`, all `destinationStatuses`, full issue objects) without re-fetching.
- Filter the summary for problem products: `gmp mc products -a ID -f json | jq '[.[] | select(.issueCount | tonumber > 0)]'`
- `disapproved` only reflects country-level disapprovals; a product can have `issueCount > 0` with lower-severity issues (`NOT_IMPACTED`/`DEMOTED`) and still show `disapproved: false`.

## See Also

- [gmp-shared](../gmp-shared/SKILL.md) -- Global flags and auth
