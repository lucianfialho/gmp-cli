export function parseDateRange(range: string): { startDate: string; endDate: string } {
  if (range.includes("..")) {
    const [start, end] = range.split("..");
    return { startDate: start!, endDate: end! };
  }

  const match = range.match(/^(\d+)d$/);
  if (match) {
    const days = parseInt(match[1]!);
    const end = new Date();
    end.setDate(end.getDate() - 3); // GSC data has ~3 day lag
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    return {
      startDate: start.toISOString().split("T")[0]!,
      endDate: end.toISOString().split("T")[0]!,
    };
  }

  // Default: last 28 days (GSC standard)
  const end = new Date();
  end.setDate(end.getDate() - 3);
  const start = new Date(end);
  start.setDate(start.getDate() - 28);
  return {
    startDate: start.toISOString().split("T")[0]!,
    endDate: end.toISOString().split("T")[0]!,
  };
}
