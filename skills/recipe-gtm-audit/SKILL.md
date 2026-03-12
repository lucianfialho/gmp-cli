---
name: recipe-gtm-audit
version: 1.0.0
description: "Recipe: Audit a GTM container — inventory tags, triggers, variables, and version history."
metadata:
  openclaw:
    category: "tag-management"
    requires:
      bins: ["gmp"]
---

# GTM Container Audit

> Inventory and audit all tags, triggers, and variables in a GTM container.

## Prerequisites

- `gmp auth login` completed
- Know your GTM account ID (run `gmp gtm accounts`)

## Workflow

### Step 1: Find your container

```bash
gmp gtm accounts
gmp gtm containers -a ACCOUNT_ID
```

Note the container `path` — you'll need it for all subsequent commands.

### Step 2: Inventory all tags

```bash
gmp gtm tags -p accounts/X/containers/Y -f table
```

Review: tag types, which triggers fire them, and any paused tags.

### Step 3: Inventory triggers

```bash
gmp gtm triggers -p accounts/X/containers/Y -f table
```

### Step 4: Inventory variables

```bash
gmp gtm variables -p accounts/X/containers/Y -f table
```

### Step 5: Check version history

```bash
gmp gtm versions -p accounts/X/containers/Y -l 10 -f table
```

Compare tag/trigger/variable counts across versions to spot unexpected changes.

### Step 6: Analyze tag distribution (JSON + jq)

```bash
# Count tags by type
gmp gtm tags -p accounts/X/containers/Y -f json | jq 'group_by(.type) | map({type: .[0].type, count: length}) | sort_by(.count) | reverse'

# Find paused tags
gmp gtm tags -p accounts/X/containers/Y -f json | jq '[.[] | select(.paused == "true")]'
```

## What to look for

- **Unused tags**: Tags with no firing triggers or paused tags that should be removed.
- **Duplicate tags**: Multiple tags of the same type that could be consolidated.
- **Custom HTML tags**: These run arbitrary JavaScript — review for security and performance.
- **Version bloat**: If tag counts are growing fast, the container may need cleanup.
- **Orphan triggers**: Triggers not attached to any tag.
