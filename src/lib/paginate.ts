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
 * until the API-reported `total` is reached, capped at `maxRows` as a safety
 * ceiling; with `limit`, stops at `limit` rows. If `total` is unknown, pages
 * until a short page. `stoppedEarly` means the API returned an empty page
 * before the reported total; `truncated` means rows were left out for any reason.
 */
export async function paginateByOffset<T>(
  fetchPage: (offset: number, limit: number) => Promise<{ items: T[]; total?: number | null }>,
  opts: { limit?: number; maxRows?: number; pageSize?: number } = {}
): Promise<{ items: T[]; total: number; truncated: boolean; stoppedEarly: boolean }> {
  const pageSize = opts.pageSize ?? GA_MAX_PAGE_SIZE;
  const cap = opts.limit ?? opts.maxRows ?? Infinity;
  const all: T[] = [];
  let total: number | undefined;
  let stoppedEarly = false;
  while (all.length < cap) {
    const want = Math.min(pageSize, cap - all.length, (total ?? Infinity) - all.length);
    const page = await fetchPage(all.length, want);
    if (page.total != null && Number(page.total) > 0) total = Number(page.total);
    for (const item of page.items) all.push(item); // no spread: pages can hold 250k rows
    if (page.items.length === 0) {
      stoppedEarly = total !== undefined && all.length < total;
      break;
    }
    if (total !== undefined ? all.length >= total : page.items.length < want) break;
  }
  const items = all.length > cap ? all.slice(0, cap) : all;
  const finalTotal = Math.max(total ?? 0, items.length);
  return { items, total: finalTotal, truncated: stoppedEarly || items.length < finalTotal, stoppedEarly };
}
