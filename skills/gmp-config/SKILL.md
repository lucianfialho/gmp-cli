---
name: gmp-config
version: 1.0.0
description: "gmp CLI: Set default GA4 property/account IDs so -p/-a can be omitted."
metadata:
  openclaw:
    category: "analytics"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp config --help"
---

# config

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth, global flags, and output formats.

Stores a default GA4 property ID and account ID locally, so every `gmp ga` subcommand's `-p/--property` and `-a/--account` flags become optional.

```bash
gmp config set property <id>
gmp config set account <id>
gmp config show
```

## Commands

| Command | Description |
|---------|-------------|
| `set property <id>` | Default GA4 property ID used when `-p/--property` is omitted |
| `set account <id>` | Default GA4 account ID used when `-a/--account` is omitted |
| `show` | Print the currently configured defaults |

## Examples

```bash
# Set once per machine/session
gmp config set property 123456789
gmp config set account 987654321

# Every ga subcommand now works without -p/-a
gmp ga report -m sessions,activeUsers -r 7d -f table
gmp ga properties
gmp ga channel-groups list

# -p/-a passed explicitly still overrides the default
gmp ga report -p 555555555 -m sessions -r 7d -f table

# Verify what's configured
gmp config show
```

## Where defaults are stored

`~/.config/gmp-cli/defaults.json`, as `{ "property": "...", "account": "..." }`. Same directory as `tokens.json` and `ads.json`.

## Tips

- Every `ga` subcommand that takes `-p/--property` or `-a/--account` falls back to this config: `report`, `realtime`, `metadata`, `check`, `properties`, `funnel`, and all of `channel-groups`.
- If neither the flag nor a default is set, the command fails immediately with the exact fix: `No property ID given. Pass -p/--property or run \`gmp config set property <id>\`.`
- Useful when scripting against a single property/account repeatedly -- set it once instead of repeating `-p 123456789` in every command.

## See Also

- [gmp-shared](../gmp-shared/SKILL.md) -- Global flags and auth
- [gmp-ga](../gmp-ga/SKILL.md) -- All GA4 commands
