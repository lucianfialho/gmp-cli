import { analyticsadmin_v1alpha } from "googleapis";

export type ChannelGroup = analyticsadmin_v1alpha.Schema$GoogleAnalyticsAdminV1alphaChannelGroup;
export type GroupingRule = analyticsadmin_v1alpha.Schema$GoogleAnalyticsAdminV1alphaGroupingRule;

export function toRow(cg: ChannelGroup): Record<string, string> {
  return {
    name: cg.name || "",
    displayName: cg.displayName || "",
    primary: String(cg.primary ?? false),
    systemDefined: String(cg.systemDefined ?? false),
    description: cg.description || "",
    rules: JSON.stringify(cg.groupingRule || []),
  };
}

export function parseRules(json: string): GroupingRule[] {
  let rules: GroupingRule[];
  try {
    rules = JSON.parse(json);
  } catch {
    throw new Error("--rules must be valid JSON (an array of GroupingRule objects)");
  }
  if (!Array.isArray(rules) || rules.length === 0) {
    throw new Error("--rules must be a non-empty JSON array");
  }
  for (const [i, rule] of rules.entries()) {
    if (!rule.displayName || !rule.expression) {
      throw new Error(`Rule ${i} needs both "displayName" and "expression"`);
    }
  }
  return rules;
}
