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

## Global Flags

| Flag | Description |
|------|-------------|
| `-f, --format <fmt>` | Output format: `json` (default), `table`, `csv` |

## Output Formats

| Format | Best for |
|--------|----------|
| `json` | Piping to `jq` or feeding to AI agents |
| `table` | Human-readable terminal output |
| `csv` | Export to spreadsheets or other tools |

## Security Rules

- **Never** output OAuth tokens or credentials directly
- Tokens are stored locally at `~/.config/gmp-cli/`
- All API calls are read-only (analytics.readonly, webmasters.readonly, tagmanager.readonly, adwords)
