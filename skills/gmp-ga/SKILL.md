---
name: gmp-ga
version: 1.0.0
description: "Google Analytics (GA4): Reports, realtime, metadata, accounts, and properties."
metadata:
  openclaw:
    category: "analytics"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp ga --help"
---

# ga (GA4 Data API + Admin API)

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth, global flags, and output formats.

```bash
gmp ga <command> [flags]
```

## Commands

| Command | Description |
|---------|-------------|
| [`report`](../gmp-ga-report/SKILL.md) | Run a report (dimensions + metrics) |
| `realtime` | Run a realtime report |
| `metadata` | List available dimensions and metrics |
| `accounts` | List GA4 accounts |
| `properties` | List GA4 properties for an account |
| `check` | Check dimension/metric compatibility |

## Quick Reference

### List accounts and properties

```bash
gmp ga accounts
gmp ga properties -a 123456789
```

### Realtime

```bash
gmp ga realtime -p PROPERTY_ID -m activeUsers
gmp ga realtime -p PROPERTY_ID -m activeUsers -d country -f table
```

### Metadata

```bash
gmp ga metadata -p PROPERTY_ID
gmp ga metadata -p PROPERTY_ID --type metrics -f table
gmp ga metadata -p PROPERTY_ID --type dimensions -f table
```

### Compatibility check

```bash
gmp ga check -p PROPERTY_ID -m sessions,bounceRate -d pagePath
```

## Tips

- Property IDs are numeric (e.g. `123456789`), not the `G-XXXXXXXX` measurement ID.
- Use `gmp ga metadata` to discover available metrics and dimensions before running reports.
- Use `gmp ga check` to validate metric/dimension combinations before complex reports.
- Default output is JSON -- use `-f table` for human-readable output.
