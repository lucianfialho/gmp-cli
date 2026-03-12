import Table from "cli-table3";

export type OutputFormat = "json" | "table" | "csv";

export function formatOutput(
  data: Record<string, unknown>[],
  format: OutputFormat,
  headers?: string[]
): string {
  switch (format) {
    case "json":
      return JSON.stringify(data, null, 2);
    case "csv":
      return formatCsv(data, headers);
    case "table":
      return formatTable(data, headers);
    default:
      return JSON.stringify(data, null, 2);
  }
}

function formatCsv(
  data: Record<string, unknown>[],
  headers?: string[]
): string {
  if (data.length === 0) return "";
  const keys = headers || Object.keys(data[0]);
  const lines = [keys.join(",")];
  for (const row of data) {
    lines.push(
      keys
        .map((k) => {
          const val = String(row[k] ?? "");
          return val.includes(",") ? `"${val}"` : val;
        })
        .join(",")
    );
  }
  return lines.join("\n");
}

function formatTable(
  data: Record<string, unknown>[],
  headers?: string[]
): string {
  if (data.length === 0) return "No data";
  const keys = headers || Object.keys(data[0]);
  const table = new Table({ head: keys });
  for (const row of data) {
    table.push(keys.map((k) => String(row[k] ?? "")));
  }
  return table.toString();
}
