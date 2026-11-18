import { Command } from "commander";
import { google, analyticsdata_v1beta } from "googleapis";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { computeCompareRange, parseDateRange, resolveConcreteDateRange, rowsToObjects, runPaginatedReport, toISODate, type CompareMode } from "./helpers.js";
import { resolveProperty } from "../../lib/config.js";

type DimensionHeader = analyticsdata_v1beta.Schema$DimensionHeader;
type MetricHeader = analyticsdata_v1beta.Schema$MetricHeader;

export function registerReportCommand(ga: Command): void {
  ga.command("report")
    .description("Run a report (dimensions + metrics)")
    .option("-p, --property <id>", "GA4 property ID (numeric); defaults to `gmp config set property`")
    .requiredOption("-m, --metrics <list>", "Comma-separated metrics")
    .option("-d, --dimensions <list>", "Comma-separated dimensions")
    .option("-r, --date-range <range>", "Date range: 30d, 7d, 2024-01-01..2024-01-31", "30d")
    .option("-l, --limit <n>", "Max rows to return (default: all rows, auto-paginated)")
    .option("--filter <expr>", "Dimension filter (fieldName==value)")
    .option("--sort <field>", "Sort by this dimension or metric name (must be one of --metrics/--dimensions)")
    .option("--order <dir>", "Sort direction: asc, desc", "desc")
    .option("--compare <mode>", "Compare --date-range against: previous_period, previous_year")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "json")
    .action(async (opts) => {
      try {
        const property = resolveProperty(opts.property);
        const auth = getAuthClient();
        const analyticsData = google.analyticsdata({ version: "v1beta", auth });

        let dateRanges: analyticsdata_v1beta.Schema$DateRange[];
        if (opts.compare) {
          if (opts.compare !== "previous_period" && opts.compare !== "previous_year") {
            throw new Error('--compare must be "previous_period" or "previous_year"');
          }
          const current = resolveConcreteDateRange(opts.dateRange);
          const compare = computeCompareRange(current, opts.compare as CompareMode);
          dateRanges = [
            { startDate: toISODate(current.start), endDate: toISODate(current.end), name: "current" },
            { ...compare, name: "previous" },
          ];
        } else {
          dateRanges = [parseDateRange(opts.dateRange)];
        }

        const metrics = (opts.metrics as string).split(",").map((m) => ({ name: m.trim() }));
        const dimensions = opts.dimensions
          ? (opts.dimensions as string).split(",").map((d) => ({ name: d.trim() }))
          : undefined;

        let orderBys: analyticsdata_v1beta.Schema$OrderBy[] | undefined;
        if (opts.sort) {
          const desc = (opts.order as string) !== "asc";
          if (metrics.some((m) => m.name === opts.sort)) {
            orderBys = [{ metric: { metricName: opts.sort as string }, desc }];
          } else if (dimensions?.some((d) => d.name === opts.sort)) {
            orderBys = [{ dimension: { dimensionName: opts.sort as string }, desc }];
          } else {
            throw new Error(`--sort "${opts.sort}" must be one of the requested --metrics/--dimensions`);
          }
        }

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

        let limit: number | undefined;
        if (opts.limit !== undefined) {
          limit = Number(opts.limit);
          if (!Number.isInteger(limit) || limit <= 0) throw new Error("--limit must be a positive integer");
        }

        const result = await runPaginatedReport(
          (params) => analyticsData.properties.runReport(params),
          `properties/${property}`,
          { dateRanges, metrics, dimensions, dimensionFilter, orderBys },
          limit
        );
        const dimHeaders = (result.first.dimensionHeaders || []).map((h: DimensionHeader) => h.name || "");
        const metricHeaders = (result.first.metricHeaders || []).map((h: MetricHeader) => h.name || "");
        const headers = [...dimHeaders, ...metricHeaders];
        const rows = rowsToObjects(result.rows, dimHeaders, metricHeaders);

        console.log(formatOutput(rows, opts.format as OutputFormat, headers));

        if (result.total) {
          console.error(`\n# ${result.total} total rows`);
        }
        if (result.truncated) {
          if (limit !== undefined) {
            console.error(`# truncated: returned ${rows.length} of ${result.total} rows (--limit ${limit})`);
          } else {
            console.error(`# WARNING: truncated: returned only ${rows.length} of ${result.total} rows (API stopped returning rows)`);
            process.exitCode = 1;
          }
        }
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
