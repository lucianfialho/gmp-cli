import { Command } from "commander";
import { getAuthClient } from "../../lib/auth.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";
import { parseDateRange, rowsToObjects } from "./helpers.js";
import { resolveProperty } from "../../lib/config.js";

// The `googleapis` npm package does not yet expose runFunnelReport in its
// generated types (confirmed against v188.0.0), even though it is live in
// Google's own analyticsdata v1alpha discovery document. Call it directly
// over REST through the authenticated client instead of google.analyticsdata().
const FUNNEL_REPORT_URL = "https://analyticsdata.googleapis.com/v1alpha";

interface FunnelEventFilter {
  eventName: string;
}

interface FunnelFilterExpression {
  andGroup?: { expressions: FunnelFilterExpression[] };
  orGroup?: { expressions: FunnelFilterExpression[] };
  notExpression?: FunnelFilterExpression;
  funnelFieldFilter?: Record<string, unknown>;
  funnelEventFilter?: FunnelEventFilter;
}

interface FunnelStep {
  name?: string;
  isDirectlyFollowedBy?: boolean;
  withinDurationFromPriorStep?: string;
  filterExpression: FunnelFilterExpression;
}

interface StepInput {
  name?: string;
  eventName?: string;
  filter?: FunnelFilterExpression;
  isDirectlyFollowedBy?: boolean;
  withinDurationFromPriorStep?: string;
}

interface DimensionHeader { name?: string }
interface MetricHeader { name?: string }
interface ApiRow {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
}
interface FunnelSubReport {
  dimensionHeaders?: DimensionHeader[];
  metricHeaders?: MetricHeader[];
  rows?: ApiRow[];
}
interface RunFunnelReportResponse {
  funnelVisualization?: FunnelSubReport;
  funnelTable?: FunnelSubReport;
}

function dedupeNames(names: string[]): string[] {
  return Array.from(new Set(names));
}

function parseSteps(json: string): FunnelStep[] {
  let input: StepInput[];
  try {
    input = JSON.parse(json);
  } catch {
    throw new Error("--steps must be valid JSON (an array of step objects)");
  }
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("--steps must be a non-empty JSON array");
  }

  return input.map((step, i) => {
    if (!step.eventName && !step.filter) {
      throw new Error(`Step ${i} needs either "eventName" or "filter"`);
    }
    return {
      name: step.name,
      isDirectlyFollowedBy: step.isDirectlyFollowedBy,
      withinDurationFromPriorStep: step.withinDurationFromPriorStep,
      filterExpression: step.filter ?? { funnelEventFilter: { eventName: step.eventName! } },
    };
  });
}

export function registerFunnelCommand(ga: Command): void {
  ga.command("funnel")
    .description("Run a funnel report (GA4 Data API v1alpha, runFunnelReport)")
    .option("-p, --property <id>", "GA4 property ID (numeric); defaults to `gmp config set property`")
    .requiredOption(
      "--steps <json>",
      'JSON array of funnel steps, e.g. \'[{"name":"View","eventName":"page_view"},{"name":"Purchase","eventName":"purchase"}]\''
    )
    .option("-r, --date-range <range>", "Date range: 30d, 7d, 2024-01-01..2024-01-31", "30d")
    .option("--type <type>", "Visualization type: standard, trended", "standard")
    .option("--open", "Open funnel (users may enter at any step)", false)
    .option("--breakdown <dimension>", "Dimension to break down each funnel step by (funnel table only)")
    .option("--limit <n>", "Row limit", "10000")
    .option("--report <which>", "Which sub-report to show for table/csv: table, visualization", "table")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action(async (opts) => {
      try {
        const property = resolveProperty(opts.property);
        const auth = getAuthClient();
        const steps = parseSteps(opts.steps as string);
        const dateRange = parseDateRange(opts.dateRange);

        const requestBody = {
          dateRanges: [dateRange],
          funnel: { steps, isOpenFunnel: Boolean(opts.open) },
          funnelVisualizationType:
            (opts.type as string) === "trended" ? "TRENDED_FUNNEL" : "STANDARD_FUNNEL",
          funnelBreakdown: opts.breakdown
            ? { breakdownDimension: { name: opts.breakdown as string } }
            : undefined,
          limit: opts.limit as string,
        };

        const response = await auth.request<RunFunnelReportResponse>({
          url: `${FUNNEL_REPORT_URL}/properties/${property}:runFunnelReport`,
          method: "POST",
          data: requestBody,
        });

        if ((opts.format as OutputFormat) === "json") {
          console.log(JSON.stringify(response.data, null, 2));
          return;
        }

        const subReport =
          (opts.report as string) === "visualization"
            ? response.data.funnelVisualization
            : response.data.funnelTable;

        // The v1alpha runFunnelReport endpoint currently returns each header
        // name duplicated (observed: 8 metricHeaders for 4 metricValues per
        // row). Dedupe by name so columns line up with the actual values.
        const dimHeaders = dedupeNames((subReport?.dimensionHeaders || []).map((h) => h.name || ""));
        const metricHeaders = dedupeNames((subReport?.metricHeaders || []).map((h) => h.name || ""));
        const headers = [...dimHeaders, ...metricHeaders];
        const rows = rowsToObjects(subReport?.rows || [], dimHeaders, metricHeaders);

        console.log(formatOutput(rows, opts.format as OutputFormat, headers));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
