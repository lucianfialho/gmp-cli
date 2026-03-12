---
name: gmp-gtm
version: 1.0.0
description: "Google Tag Manager: Accounts, containers, tags, triggers, variables, and versions."
metadata:
  openclaw:
    category: "tag-management"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp gtm --help"
---

# gtm (Google Tag Manager API v2)

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth, global flags, and output formats.

```bash
gmp gtm <command> [flags]
```

## Commands

| Command | Description |
|---------|-------------|
| `accounts` | List GTM accounts |
| `containers` | List containers for an account |
| `tags` | List tags in a container workspace |
| `triggers` | List triggers in a container workspace |
| `variables` | List variables in a container workspace |
| `versions` | List published container versions |

## Quick Reference

### List accounts and containers

```bash
gmp gtm accounts
gmp gtm containers -a ACCOUNT_ID
```

### List tags, triggers, and variables

```bash
# Uses default workspace automatically
gmp gtm tags -p accounts/X/containers/Y -f table
gmp gtm triggers -p accounts/X/containers/Y -f table
gmp gtm variables -p accounts/X/containers/Y -f table

# Specific workspace
gmp gtm tags -p accounts/X/containers/Y -w 3 -f table
```

### List published versions

```bash
gmp gtm versions -p accounts/X/containers/Y -f table
gmp gtm versions -p accounts/X/containers/Y -l 5 -f table
```

## Container Path Format

All tag/trigger/variable/version commands require a container path:

```
accounts/{ACCOUNT_ID}/containers/{CONTAINER_ID}
```

Get the account ID from `gmp gtm accounts` and container ID from `gmp gtm containers -a ACCOUNT_ID`.

## Workspace Behavior

- Default: `-w 0` uses the "Default Workspace" automatically.
- Specify `-w <ID>` for a specific workspace.
- The CLI resolves the default workspace by listing workspaces and picking "Default Workspace" or the first available.

## Output Columns

### Tags
| Column | Description |
|--------|-------------|
| `tagId` | Tag ID |
| `name` | Tag name |
| `type` | Tag type (e.g. `ua`, `awct`, `html`) |
| `firingTriggerId` | Comma-separated trigger IDs |
| `paused` | Whether the tag is paused |

### Triggers
| Column | Description |
|--------|-------------|
| `triggerId` | Trigger ID |
| `name` | Trigger name |
| `type` | Trigger type (e.g. `pageview`, `click`, `customEvent`) |

### Variables
| Column | Description |
|--------|-------------|
| `variableId` | Variable ID |
| `name` | Variable name |
| `type` | Variable type (e.g. `v`, `jsm`, `gas`) |

## Tips

- Get the container path from `gmp gtm containers -a ACCOUNT_ID` -- use the `path` column.
- Tags, triggers, and variables are workspace-scoped. Use `-w 0` for the default workspace.
- Use `gmp gtm versions` to see publish history and compare tag/trigger/variable counts across versions.
- Pipe to `jq` for analysis: `gmp gtm tags ... -f json | jq '[.[] | select(.type == "html")]'`
