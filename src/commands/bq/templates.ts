import { Command } from "commander";
import { listTemplates } from "../../lib/bq-templates.js";
import { formatOutput, type OutputFormat } from "../../lib/format.js";

export function registerTemplatesCommand(bq: Command): void {
  bq.command("templates")
    .description("List available pre-built query templates")
    .option("--service <svc>", "Filter by service: ga4, ads, gsc")
    .option("-f, --format <fmt>", "Output format: json, table, csv", "table")
    .action((opts) => {
      const tpls = listTemplates(opts.service);

      if (tpls.length === 0) {
        console.log(
          opts.service
            ? `No templates found for service: ${opts.service}`
            : "No templates found"
        );
        return;
      }

      const rows = tpls.map((t) => ({
        name: t.name,
        service: t.service,
        description: t.description,
        params: t.params.join(", "),
      }));

      console.log(
        formatOutput(rows, opts.format as OutputFormat, [
          "name",
          "service",
          "description",
          "params",
        ])
      );
    });
}
