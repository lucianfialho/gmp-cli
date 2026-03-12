import { Command } from "commander";
import { google, analyticsdata_v1beta } from "googleapis";
import { getAuthClient } from "../lib/auth.js";
import { formatOutput, type OutputFormat } from "../lib/format.js";

type Row = analyticsdata_v1beta.Schema$Row;
type DimensionHeader = analyticsdata_v1beta.Schema$DimensionHeader;
type MetricHeader = analyticsdata_v1beta.Schema$MetricHeader;

function parseDate(input: string): string {
  if (input === "today") return "today";
  if (input === "yesterday") return "yesterday";
  const match = input.match(/^(\d+)d$/);
  if (match) return `${match[1]}daysAgo`;
  return input;
}

function parseDateRange(range: string): { startDate: string; endDate: string } {
  if (range.includes("..")) {
    const [start, end] = range.split("..");
    return { startDate: parseDate(start!), endDate: parseDate(end!) };
  }
  return { startDate: parseDate(range), endDate: "today" };
}

function rowsToObjects(
  rows: Row[],
  dimHeaders: string[],
  metricHeaders: string[]
): Record<string, string>[] {
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    (row.dimensionValues || []).forEach((v, i) => {
      obj[dimHeaders[i]!] = v.value || "";
    });
    (row.metricValues || []).forEach((v, i) => {
      obj[metricHeaders[i]!] = v.value || "";
    });
    return obj;
  });
}

export function registerGaCommand(program: Command): void {
  const ga = program
    .command("ga")
    .description("Google Analytics Data API (GA4)");

  // --- ga report ---
  ga.command("report")
    .description("Run a report (dimensions + metrics)")
    .requiredOption("-p, --property <id>", "GA4 property ID (numeric)")
    .requiredOption("-m, --metrics <list>", "Comma-separated metrics")
    .option("-d, --dimensions <list>", "Comma-separated dimensions")
    .option("-r, --date-range <range>", "Date range: 30d, 7d, 2024-01-01..2024-01-31", "30d")
    .option("-l, --limit <n>", "Row limit", "10000")
    .option("--filter <expr>", "Dimension filter (fieldName==value)")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const analyticsData = google.analyticsdata({ version: "v1beta", auth });

        const dateRange = parseDateRange(opts.dateRange);
        const metrics = (opts.metrics as string).split(",").map((m) => ({ name: m.trim() }));
        const dimensions = opts.dimensions
          ? (opts.dimensions as string).split(",").map((d) => ({ name: d.trim() }))
          : undefined;

        let dimensionFilter: analyticsdata_v1beta.Schema$FilterExpression | undefined;
        if (opts.filter) {
          const [field, value] = (opts.filter as string).split("==");
          if (field && value) {
            dimensionFilter = {
              filter: {
                fieldName: field.trim(),
                stringFilter: { value: value.trim(), matchType: "EXACT" },
              },
            };
          }
        }

        const response = await analyticsData.properties.runReport({
          property: `properties/${opts.property}`,
          requestBody: {
            dateRanges: [dateRange],
            metrics,
            dimensions,
            dimensionFilter,
            limit: opts.limit as string,
          },
        });

        const dimHeaders = (response.data.dimensionHeaders || []).map((h: DimensionHeader) => h.name || "");
        const metricHeaders = (response.data.metricHeaders || []).map((h: MetricHeader) => h.name || "");
        const headers = [...dimHeaders, ...metricHeaders];
        const rows = rowsToObjects(response.data.rows || [], dimHeaders, metricHeaders);

        console.log(formatOutput(rows, opts.format as OutputFormat, headers));

        if (response.data.rowCount) {
          console.error(`\n# ${response.data.rowCount} total rows`);
        }
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  // --- ga realtime ---
  ga.command("realtime")
    .description("Run a realtime report")
    .requiredOption("-p, --property <id>", "GA4 property ID")
    .requiredOption("-m, --metrics <list>", "Comma-separated metrics")
    .option("-d, --dimensions <list>", "Comma-separated dimensions")
    .option("-l, --limit <n>", "Row limit", "100")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const analyticsData = google.analyticsdata({ version: "v1beta", auth });

        const metrics = (opts.metrics as string).split(",").map((m) => ({ name: m.trim() }));
        const dimensions = opts.dimensions
          ? (opts.dimensions as string).split(",").map((d) => ({ name: d.trim() }))
          : undefined;

        const response = await analyticsData.properties.runRealtimeReport({
          property: `properties/${opts.property}`,
          requestBody: { metrics, dimensions, limit: opts.limit as string },
        });

        const dimHeaders = (response.data.dimensionHeaders || []).map((h: DimensionHeader) => h.name || "");
        const metricHeaders = (response.data.metricHeaders || []).map((h: MetricHeader) => h.name || "");
        const headers = [...dimHeaders, ...metricHeaders];
        const rows = rowsToObjects(response.data.rows || [], dimHeaders, metricHeaders);

        console.log(formatOutput(rows, opts.format as OutputFormat, headers));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  // --- ga metadata ---
  ga.command("metadata")
    .description("List available dimensions and metrics")
    .requiredOption("-p, --property <id>", "GA4 property ID")
    .option("--type <type>", "Filter: dimensions, metrics, or all", "all")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const analyticsData = google.analyticsdata({ version: "v1beta", auth });

        const response = await analyticsData.properties.getMetadata({
          name: `properties/${opts.property}/metadata`,
        });

        const data = response.data;
        const results: Record<string, string>[] = [];

        if (opts.type === "all" || opts.type === "dimensions") {
          for (const dim of data.dimensions || []) {
            results.push({
              type: "dimension",
              apiName: dim.apiName || "",
              uiName: dim.uiName || "",
              category: dim.category || "",
              description: dim.description || "",
            });
          }
        }

        if (opts.type === "all" || opts.type === "metrics") {
          for (const met of data.metrics || []) {
            results.push({
              type: "metric",
              apiName: met.apiName || "",
              uiName: met.uiName || "",
              category: met.category || "",
              description: met.description || "",
            });
          }
        }

        console.log(
          formatOutput(results, opts.format as OutputFormat, [
            "type",
            "apiName",
            "uiName",
            "category",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  // --- ga accounts ---
  ga.command("accounts")
    .description("List GA4 accounts")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const admin = google.analyticsadmin({ version: "v1beta", auth });

        const response = await admin.accounts.list();
        const accounts = (response.data.accounts || []).map((a) => ({
          name: a.name || "",
          displayName: a.displayName || "",
          createTime: a.createTime || "",
          regionCode: a.regionCode || "",
        }));

        console.log(
          formatOutput(accounts, opts.format as OutputFormat, [
            "name",
            "displayName",
            "regionCode",
            "createTime",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  // --- ga properties ---
  ga.command("properties")
    .description("List GA4 properties for an account")
    .requiredOption("-a, --account <id>", "Account ID (numeric)")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const admin = google.analyticsadmin({ version: "v1beta", auth });

        const response = await admin.properties.list({
          filter: `parent:accounts/${opts.account}`,
        });

        const properties = (response.data.properties || []).map((p) => ({
          name: p.name || "",
          displayName: p.displayName || "",
          propertyType: p.propertyType || "",
          timeZone: p.timeZone || "",
          currencyCode: p.currencyCode || "",
        }));

        console.log(
          formatOutput(properties, opts.format as OutputFormat, [
            "name",
            "displayName",
            "propertyType",
            "timeZone",
            "currencyCode",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  // --- ga check ---
  ga.command("check")
    .description("Check dimension/metric compatibility")
    .requiredOption("-p, --property <id>", "GA4 property ID")
    .requiredOption("-m, --metrics <list>", "Comma-separated metrics")
    .option("-d, --dimensions <list>", "Comma-separated dimensions")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        const auth = getAuthClient();
        const analyticsData = google.analyticsdata({ version: "v1beta", auth });

        const metrics = (opts.metrics as string).split(",").map((m) => ({ name: m.trim() }));
        const dimensions = opts.dimensions
          ? (opts.dimensions as string).split(",").map((d) => ({ name: d.trim() }))
          : undefined;

        const response = await analyticsData.properties.checkCompatibility({
          property: `properties/${opts.property}`,
          requestBody: { metrics, dimensions },
        });

        const results: Record<string, string>[] = [];

        for (const dc of response.data.dimensionCompatibilities || []) {
          results.push({
            type: "dimension",
            name: dc.dimensionMetadata?.apiName || "",
            compatibility: dc.compatibility || "",
          });
        }
        for (const mc of response.data.metricCompatibilities || []) {
          results.push({
            type: "metric",
            name: mc.metricMetadata?.apiName || "",
            compatibility: mc.compatibility || "",
          });
        }

        console.log(
          formatOutput(results, opts.format as OutputFormat, [
            "type",
            "name",
            "compatibility",
          ])
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
