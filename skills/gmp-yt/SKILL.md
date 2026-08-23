---
name: gmp-yt
version: 1.0.0
description: "YouTube Data API v3: channel stats, video performance, and public video search."
metadata:
  openclaw:
    category: "analytics"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp yt --help"
---

# yt (YouTube Data API v3)

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth, global flags, and output formats.

```bash
gmp yt <command> [flags]
```

## Commands

| Command | Description |
|---------|-------------|
| [`videos`](../gmp-yt-videos/SKILL.md) | List channel videos with views, likes and comments |
| `channel` | Channel overview: subscribers, total views, video count |
| `video` | Stats for one or more videos by ID |
| `search` | Search public videos (100 quota units per call) |

## Credentials

`gmp yt` accepts either an API key or the standard OAuth login. Prefer the API key: these are public metrics and the key never expires.

```bash
export YOUTUBE_API_KEY=AIza...       # APIs & Services > Credentials
export YOUTUBE_CHANNEL_ID=@handle    # optional default channel
```

Requires **YouTube Data API v3** to be enabled in the Google Cloud project. Without `YOUTUBE_API_KEY`, the CLI falls back to the `gmp auth login` token (scope `youtube.readonly`), and omitting `--channel` then resolves to the authenticated user's own channel.

## Channel References

`--channel` accepts either form:

| Form | Example |
|------|---------|
| Channel ID | `UCBJycsmduvYEL83R_U4JriQ` |
| Handle | `@mkbhd` |

## Quick Reference

### Channel overview

```bash
gmp yt channel -c @mkbhd
gmp yt channel -c UCBJycsmduvYEL83R_U4JriQ -f json
```

Columns: `channelId`, `title`, `handle`, `subscribers`, `totalViews`, `videoCount`, `publishedAt`.

### Video stats by ID

```bash
gmp yt video -i dQw4w9WgXcQ
gmp yt video -i dQw4w9WgXcQ,9bZkp7q19f0 -f table
```

### Search public videos

```bash
gmp yt search -q "product analytics" -n 20
gmp yt search -q "tutorial" -c UCBJycsmduvYEL83R_U4JriQ -o viewCount
```

| Flag | Default | Description |
|------|---------|-------------|
| `-q, --query <q>` | -- | Search query (required) |
| `-c, --channel <id>` | -- | Restrict to a channel ID (`UC...` only) |
| `-n, --limit <n>` | `10` | Max results (1-50) |
| `-o, --order <order>` | `relevance` | relevance, date, viewCount, rating |

## Quota

Default allowance is 10,000 units per day.

| Command | Cost |
|---------|------|
| `yt channel` | 1 unit |
| `yt videos` | ~2 units per 50 videos |
| `yt video` | 1 unit per 50 IDs |
| `yt search` | 101 units |

Avoid `yt search` in loops. To enumerate a channel, `yt videos` walks the uploads playlist and costs about 50x less.

## Scope

Public metrics only. Watch time, audience retention, impression CTR, traffic sources and demographics belong to the **YouTube Analytics API**, which is a different API and is not implemented in this CLI.

## See Also

- [gmp-shared](../gmp-shared/SKILL.md) -- Global flags and auth
- [gmp-yt-videos](../gmp-yt-videos/SKILL.md) -- Channel video listing in detail
