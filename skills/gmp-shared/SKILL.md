---
name: gmp-shared
version: 1.0.0
description: "gmp CLI: Shared patterns for authentication, global flags, and output formatting."
metadata:
  openclaw:
    category: "analytics"
    requires:
      bins: ["gmp"]
---

# gmp -- Shared Reference

## Installation

```bash
npm install -g @lucianfialho/gmp-cli
```

Or from source:

```bash
git clone https://github.com/lucianfialho/gmp-cli.git
cd gmp-cli
npm install && npm run build && npm link
```

The `gmp` binary must be on `$PATH`.

## Authentication

```bash
# Browser-based OAuth (opens default browser)
gmp auth login

# Check auth status
gmp auth status

# Use your own OAuth credentials (optional)
gmp auth set-credentials --client-id YOUR_ID --client-secret YOUR_SECRET

# Logout
gmp auth logout
```

Tokens are stored in `~/.config/gmp-cli/tokens.json` and auto-refresh.

### Google Ads (extra setup)

Google Ads requires a developer token in addition to OAuth:

```bash
# Set developer token
gmp auth set-developer-token YOUR_TOKEN

# If using a Manager Account (MCC)
gmp auth set-login-customer-id 1234567890
```

### YouTube (alternative auth)

`gmp yt` reads public data and accepts an API key instead of OAuth:

```bash
export YOUTUBE_API_KEY=AIza...       # APIs & Services > Credentials
export YOUTUBE_CHANNEL_ID=@handle    # optional default channel
```

Without the key it falls back to the OAuth token (scope `youtube.readonly`).

## Global Flags

| Flag | Description |
|------|-------------|
| `-f, --format <fmt>` | Output format: `json` (default), `table`, `csv` |

## Defaults (`gmp config`)

Every `gmp ga` subcommand's `-p/--property` and `-a/--account` flags are optional -- they fall back to a stored default when omitted.

```bash
gmp config set property 123456789
gmp config set account 987654321
gmp config show
```

Passing `-p`/`-a` explicitly always overrides the stored default. If neither is set, the command errors with the exact command to run.

## Output Formats

| Format | Best for |
|--------|----------|
| `json` | Piping to `jq` or feeding to AI agents |
| `table` | Human-readable terminal output |
| `csv` | Export to spreadsheets or other tools |

## Security Rules

- **Never** output OAuth tokens or credentials directly
- Tokens are stored locally at `~/.config/gmp-cli/`
- The default OAuth scopes are read-only: `analytics.readonly`, `webmasters.readonly`, `tagmanager.readonly`, `adwords`, `bigquery.readonly`, `content`, `youtube.readonly`
- The one write-capable surface is `gmp ga channel-groups create/update/delete`, which requires `analytics.edit`. That scope is deliberately not in the list above, so these three commands currently fail with "insufficient authentication scopes" for every user -- that's expected given today's scopes, not a bug. `gmp ga channel-groups list/get` work fine with the default read-only scope.
- **Never** echo `YOUTUBE_API_KEY` in output or logs
