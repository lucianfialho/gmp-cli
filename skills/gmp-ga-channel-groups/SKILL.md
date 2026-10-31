---
name: gmp-ga-channel-groups
version: 1.0.0
description: "GA4: Manage custom channel groups (Admin API v1alpha) -- list, get, create, update, delete."
metadata:
  openclaw:
    category: "analytics"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp ga channel-groups --help"
---

# ga channel-groups

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth, global flags, and output formats.

Manage GA4 custom channel groups (GA4 Admin API v1alpha). Useful for fixing "Unassigned" traffic by adding rules that classify UTMs GA4's default channel definitions miss.

```bash
gmp ga channel-groups <command> [flags]
```

## Commands

| Command | Description | OAuth scope needed |
|---------|-------------|---------------------|
| `list` | List custom channel groups for a property | `analytics.readonly` (default) |
| `get` | Get one group's full details, including its grouping rules | `analytics.readonly` (default) |
| `create` | Create a custom channel group | `analytics.edit` |
| `update` | Update a channel group's name/rules/description/primary flag | `analytics.edit` |
| `delete` | Delete a custom channel group | `analytics.edit` |

`list`/`get` work out of the box with the CLI's default scope. `create`/`update`/`delete` need `analytics.edit` -- if your token only has `analytics.readonly`, those three fail with "insufficient authentication scopes", which is expected, not a bug. See `../gmp-shared/SKILL.md` for the full scope list.

## Quick Reference

### List and inspect

```bash
gmp ga channel-groups list -p PROPERTY_ID -f table
gmp ga channel-groups get -p PROPERTY_ID -g GROUP_ID
```

`get` defaults to `-f json` (the grouping rules are nested and don't flatten well into a table); `list` defaults to `-f table`.

### Create

```bash
gmp ga channel-groups create -p PROPERTY_ID \
  -n "LinkedIn Campaigns" \
  --rules '[{"displayName":"LinkedIn","expression":{"orGroup":{"filterExpressions":[{"filter":{"fieldName":"sessionSource","stringFilter":{"value":"linkedin","matchType":"CONTAINS"}}}]}}}]'
```

### Update

```bash
# Replace the rules
gmp ga channel-groups update -p PROPERTY_ID -g GROUP_ID --rules '[...]'

# Rename and set as the primary channel group used in reports
gmp ga channel-groups update -p PROPERTY_ID -g GROUP_ID -n "New name" --primary
```

### Delete

```bash
gmp ga channel-groups delete -p PROPERTY_ID -g GROUP_ID
```

## Flags

| Flag | Applies to | Description |
|------|-----------|-------------|
| `-p, --property <id>` | all | GA4 property ID; falls back to `gmp config set property` |
| `-g, --group <id>` | get, update, delete | Channel group ID (the last path segment, not the full resource name) |
| `-n, --name <displayName>` | create (required), update (optional) | Display name for the group |
| `--rules <json>` | create (required), update (optional) | JSON array of `GroupingRule` objects -- see below |
| `--description <text>` | create, update | Description, max 256 characters |
| `--primary` | create, update | Set as the primary channel group used in standard reports |
| `-f, --format <fmt>` | list, get, create, update | Output format: json, table, csv |

## `--rules` Format

`--rules` takes the raw Admin API `GroupingRule[]` schema directly -- it's a filter-expression tree (AND/OR/NOT), not a simplified DSL, because real rules (like isolating a specific UTM source) need that nesting. Each rule needs `displayName` and `expression`:

```json
[
  {
    "displayName": "Gustavo / LinkedIn",
    "expression": {
      "orGroup": {
        "filterExpressions": [
          {"filter": {"fieldName": "sessionSource", "stringFilter": {"value": "linkedin", "matchType": "CONTAINS"}}}
        ]
      }
    }
  }
]
```

A full channel group has up to 50 such rules in `groupingRule`. Only one channel group per property can have `primary: true` -- setting it on a new one unsets it on the previous primary.

## Tips

- Get the channel group ID from `gmp ga channel-groups list -p PROPERTY_ID` -- it's the last segment of `name` (`properties/X/channelGroups/<this>`).
- Google's own "Default channel group" always appears in `list` with `systemDefined: true` -- you cannot update or delete it, only create additional custom groups alongside it.
- `update`'s `--rules` **replaces** the entire rule set, it doesn't merge -- fetch the current rules with `get -f json` first if you only want to add one rule.
- `create`/`update`/`delete` will fail with "insufficient authentication scopes" for every user as the CLI ships today: `analytics.edit` is deliberately not in the default `SCOPES` list (`src/lib/auth-config.ts`), so `gmp auth login` never requests it, with or without custom credentials via `auth set-credentials`. There is currently no supported path to the write scope -- `list`/`get` are what actually works.

## See Also

- [gmp-ga](../gmp-ga/SKILL.md) -- All GA4 commands
- [gmp-shared](../gmp-shared/SKILL.md) -- Global flags, auth, and OAuth scopes
