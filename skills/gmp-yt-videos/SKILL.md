---
name: gmp-yt-videos
version: 1.0.0
description: "YouTube: list channel videos with views, likes, comments and duration."
metadata:
  openclaw:
    category: "analytics"
    requires:
      bins: ["gmp"]
    cliHelp: "gmp yt videos --help"
---

# yt videos

> **PREREQUISITE:** Read `../gmp-shared/SKILL.md` for auth, global flags, and output formats.

List a channel's uploads with per-video engagement metrics.

## Usage

```bash
gmp yt videos [flags]
```

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `-c, --channel <ref>` | No | `$YOUTUBE_CHANNEL_ID` | Channel ID (`UC...`) or `@handle` |
| `-n, --limit <n>` | No | `25` | How many videos to fetch, most recent first |
| `-s, --sort <field>` | No | `date` | Sort the fetched window: date, views, likes, comments |
| `-f, --format <fmt>` | No | `table` | Output format: json, table, csv |

## Output Columns

| Column | Description |
|--------|-------------|
| `publishedAt` | Publish date (YYYY-MM-DD) |
| `videoId` | Video ID |
| `title` | Video title |
| `views` | View count |
| `likes` | Like count |
| `comments` | Comment count |
| `duration` | Runtime as `m:ss` or `h:mm:ss` |
| `url` | Short URL (JSON and CSV output only) |

## Examples

```bash
# 25 most recent uploads
gmp yt videos -c @mkbhd

# Best performers among the last 100 uploads
gmp yt videos -c @mkbhd -n 100 -s views

# Most discussed videos
gmp yt videos -c @mkbhd -n 100 -s comments -f table

# Full catalog to CSV
gmp yt videos -c @mkbhd -n 500 -f csv > videos.csv

# Videos above 10k views
gmp yt videos -c @mkbhd -n 100 -f json | jq '[.[] | select(.views > 10000)]'

# Engagement rate per video
gmp yt videos -c @mkbhd -f json | jq '[.[] | {title, rate: (.likes / .views * 100)}]'
```

## Tips

- `--sort` orders only the videos that were fetched. To rank an entire catalog, set `-n` above the channel's `videoCount` (from `gmp yt channel`).
- Fetching is cheap: the command reads the uploads playlist (1 unit per page of 50) rather than `search.list` (100 units per call). Listing 500 videos costs about 20 units.
- Shorts and long-form videos are mixed in the same list. Split them with the `duration` column.
- View counts are cumulative since publication, so recent uploads always look weaker. Compare videos of similar age.

## See Also

- [gmp-shared](../gmp-shared/SKILL.md) -- Global flags and auth
- [gmp-yt](../gmp-yt/SKILL.md) -- All YouTube commands
