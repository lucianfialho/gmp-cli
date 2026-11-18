export async function paginateAll<T>(
  fetchPage: (pageToken?: string) => Promise<{ items: T[]; nextPageToken?: string | null }>
): Promise<T[]> {
  const all: T[] = [];
  let pageToken: string | undefined;
  do {
    const { items, nextPageToken } = await fetchPage(pageToken);
    all.push(...items);
    pageToken = nextPageToken || undefined;
  } while (pageToken);
  return all;
}

/** Maximum rows the GA4 Data API returns per runReport request. */
export const GA_MAX_PAGE_SIZE = 250000;

/**
 * Offset/limit pagination (e.g. GA4 runReport). Without `limit`, keeps fetching
 * until the API-reported `total` is reached; with `limit`, stops at `limit` rows.
 * Stops early if a page comes back empty, flagging the result as truncated.
 */
export async function paginateByOffset<T>(
  fetchPage: (offset: number, limit: number) => Promise<{ items: T[]; total?: number | null }>,
  opts: { limit?: number; pageSize?: number } = {}
): Promise<{ items: T[]; total: number; truncated: boolean }> {
  const pageSize = opts.pageSize ?? GA_MAX_PAGE_SIZE;
  const all: T[] = [];
  let total = 0;
  let target = opts.limit;
  do {
    const want = Math.min(pageSize, (target ?? Infinity) - all.length);
    const page = await fetchPage(all.length, want);
    if (page.total != null) total = Number(page.total);
    for (const item of page.items) all.push(item); // no spread: pages can hold 250k rows
    if (target === undefined) target = total;
    if (page.items.length === 0) break;
  } while (all.length < Math.min(target, total));
  total = Math.max(total, all.length);
  const items = all.slice(0, target);
  return { items, total, truncated: items.length < total };
}
