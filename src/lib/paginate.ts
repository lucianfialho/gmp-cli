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
