import { Command } from "commander";
import { google, youtube_v3 } from "googleapis";
import { getAuthClient, isAuthenticated } from "../lib/auth.js";
import { formatOutput, type OutputFormat } from "../lib/format.js";

type AuthMode = "apikey" | "oauth";

interface Client {
  youtube: youtube_v3.Youtube;
  mode: AuthMode;
}

// Public YouTube data works with either an API key or OAuth.
// An API key is preferred: it never expires and needs no consent screen.
function getClient(): Client {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    return { youtube: google.youtube({ version: "v3", auth: apiKey }), mode: "apikey" };
  }
  if (isAuthenticated()) {
    return {
      youtube: google.youtube({ version: "v3", auth: getAuthClient() }),
      mode: "oauth",
    };
  }
  throw new Error(
    "No YouTube credentials. Either set YOUTUBE_API_KEY (API key from Google Cloud " +
      "Console with YouTube Data API v3 enabled), or run `gmp auth login`."
  );
}

async function getChannel(
  client: Client,
  channelRef?: string
): Promise<youtube_v3.Schema$Channel> {
  const ref = channelRef || process.env.YOUTUBE_CHANNEL_ID;
  const part = ["snippet", "statistics", "contentDetails"];

  let params: youtube_v3.Params$Resource$Channels$List;
  if (!ref) {
    // Without a reference, OAuth can still resolve the authenticated user's own channel
    if (client.mode !== "oauth") {
      throw new Error(
        "No channel given. Use --channel <UC... | @handle>, or set YOUTUBE_CHANNEL_ID."
      );
    }
    params = { part, mine: true };
  } else if (ref.startsWith("UC")) {
    params = { part, id: [ref] };
  } else {
    params = { part, forHandle: ref.startsWith("@") ? ref : `@${ref}` };
  }

  const response = await client.youtube.channels.list(params);
  const channel = response.data.items?.[0];
  if (!channel) {
    throw new Error(`Channel not found: ${ref || "authenticated user"}`);
  }
  return channel;
}

// PT1H2M30S -> 1:02:30
function formatDuration(iso?: string | null): string {
  if (!iso) return "";
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return iso;
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

interface VideoRow extends Record<string, unknown> {
  publishedAt: string;
  videoId: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  url: string;
}

function toVideoRow(video: youtube_v3.Schema$Video): VideoRow {
  const stats = video.statistics || {};
  return {
    publishedAt: (video.snippet?.publishedAt || "").split("T")[0] || "",
    videoId: video.id || "",
    title: video.snippet?.title || "",
    views: parseInt(stats.viewCount || "0"),
    likes: parseInt(stats.likeCount || "0"),
    comments: parseInt(stats.commentCount || "0"),
    duration: formatDuration(video.contentDetails?.duration),
    url: `https://youtu.be/${video.id}`,
  };
}

// videos.list accepts at most 50 ids per call
async function fetchVideoStats(
  youtube: youtube_v3.Youtube,
  videoIds: string[]
): Promise<VideoRow[]> {
  const rows: VideoRow[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const response = await youtube.videos.list({
      part: ["snippet", "statistics", "contentDetails"],
      id: videoIds.slice(i, i + 50),
    });
    rows.push(...(response.data.items || []).map(toVideoRow));
  }
  return rows;
}

const VIDEO_HEADERS = [
  "publishedAt",
  "videoId",
  "title",
  "views",
  "likes",
  "comments",
  "duration",
];

export function registerYtCommand(program: Command): void {
  const yt = program
    .command("yt")
    .description("YouTube Data API v3");

  // --- yt channel ---
  yt.command("channel")
    .description("Channel overview: subscribers, total views, video count")
    .option("-c, --channel <ref>", "Channel ID (UC...) or @handle")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const client = getClient();
        const channel = await getChannel(client, opts.channel as string | undefined);
        const stats = channel.statistics || {};

        const rows = [
          {
            channelId: channel.id || "",
            title: channel.snippet?.title || "",
            handle: channel.snippet?.customUrl || "",
            subscribers: parseInt(stats.subscriberCount || "0"),
            totalViews: parseInt(stats.viewCount || "0"),
            videoCount: parseInt(stats.videoCount || "0"),
            publishedAt: (channel.snippet?.publishedAt || "").split("T")[0] || "",
            uploadsPlaylist: channel.contentDetails?.relatedPlaylists?.uploads || "",
          },
        ];

        console.log(
          formatOutput(rows, opts.format as OutputFormat, [
            "channelId",
            "title",
            "handle",
            "subscribers",
            "totalViews",
            "videoCount",
            "publishedAt",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  // --- yt videos ---
  yt.command("videos")
    .description("List channel videos with views, likes and comments")
    .option("-c, --channel <ref>", "Channel ID (UC...) or @handle")
    .option("-n, --limit <n>", "How many videos to fetch (most recent first)", "25")
    .option("-s, --sort <field>", "Sort the fetched window: date, views, likes, comments", "date")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const client = getClient();
        const channel = await getChannel(client, opts.channel as string | undefined);
        const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
        if (!uploads) {
          throw new Error("Channel has no uploads playlist.");
        }

        const limit = parseInt(opts.limit as string);
        const videoIds: string[] = [];
        let pageToken: string | undefined;

        // playlistItems costs 1 unit per page of 50, against 100 units per search.list call
        while (videoIds.length < limit) {
          const page = (
            await client.youtube.playlistItems.list({
              part: ["contentDetails"],
              playlistId: uploads,
              maxResults: Math.min(50, limit - videoIds.length),
              pageToken,
            })
          ).data;

          for (const item of page.items || []) {
            const id = item.contentDetails?.videoId;
            if (id) videoIds.push(id);
          }

          pageToken = page.nextPageToken || undefined;
          if (!pageToken) break;
        }

        const rows = await fetchVideoStats(client.youtube, videoIds);

        const sort = opts.sort as string;
        if (sort === "views" || sort === "likes" || sort === "comments") {
          rows.sort((a, b) => (b[sort] as number) - (a[sort] as number));
        }

        console.log(formatOutput(rows, opts.format as OutputFormat, VIDEO_HEADERS));
        console.error(`\n# ${rows.length} videos from ${channel.snippet?.title || ""}`);
        if (sort !== "date") {
          console.error(`# sorted by ${sort} within the ${rows.length} most recent uploads`);
        }
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  // --- yt video ---
  yt.command("video")
    .description("Stats for one or more videos by ID")
    .requiredOption("-i, --id <ids>", "Video ID, or comma-separated IDs")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        const client = getClient();
        const ids = (opts.id as string).split(",").map((s) => s.trim()).filter(Boolean);
        const rows = await fetchVideoStats(client.youtube, ids);

        if (rows.length === 0) {
          console.error("Error: no videos found for the given IDs.");
          process.exit(1);
        }

        console.log(formatOutput(rows, opts.format as OutputFormat, VIDEO_HEADERS));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  // --- yt search ---
  yt.command("search")
    .description("Search public videos (costs 100 quota units per call)")
    .requiredOption("-q, --query <q>", "Search query")
    .option("-c, --channel <id>", "Restrict to a channel ID (UC...)")
    .option("-n, --limit <n>", "Max results (1-50)", "10")
    .option("-o, --order <order>", "Order: relevance, date, viewCount, rating", "relevance")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const client = getClient();
        const response = await client.youtube.search.list({
          part: ["id"],
          q: opts.query as string,
          type: ["video"],
          maxResults: Math.min(50, parseInt(opts.limit as string)),
          order: opts.order as string,
          ...(opts.channel ? { channelId: opts.channel as string } : {}),
        });

        const ids = (response.data.items || [])
          .map((item) => item.id?.videoId)
          .filter((id): id is string => Boolean(id));

        if (ids.length === 0) {
          console.log(formatOutput([], opts.format as OutputFormat, VIDEO_HEADERS));
          return;
        }

        const rows = await fetchVideoStats(client.youtube, ids);
        console.log(formatOutput(rows, opts.format as OutputFormat, VIDEO_HEADERS));
        console.error(`\n# ${rows.length} results, ~101 quota units spent`);
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
