export interface BqTemplate {
  name: string;
  service: "ga4" | "ads" | "gsc";
  description: string;
  sql: string;
  params: string[];
}

export const templates: BqTemplate[] = [
  // --- GA4 Templates ---
  {
    name: "ga4-events-flat",
    service: "ga4",
    description: "Flatten GA4 nested event_params into columns (page_view events)",
    params: ["project", "dataset", "start_date", "end_date"],
    sql: `SELECT
  event_date,
  event_timestamp,
  user_pseudo_id,
  event_name,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_title') AS page_title,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_referrer') AS page_referrer,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'source') AS source,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'medium') AS medium,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'campaign') AS campaign,
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec') AS engagement_time_msec,
  device.category AS device_category,
  device.operating_system AS device_os,
  geo.country AS country,
  geo.city AS city,
  traffic_source.source AS first_touch_source,
  traffic_source.medium AS first_touch_medium,
  platform
FROM \`{{project}}.{{dataset}}.events_*\`
WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
ORDER BY event_timestamp DESC
LIMIT 10000`,
  },
  {
    name: "ga4-funnel",
    service: "ga4",
    description: "Funnel analysis from event sequences within sessions",
    params: ["project", "dataset", "start_date", "end_date"],
    sql: `WITH sessions AS (
  SELECT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    event_name,
    event_timestamp
  FROM \`{{project}}.{{dataset}}.events_*\`
  WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
)
SELECT
  'session_start' AS step,
  COUNT(DISTINCT CONCAT(user_pseudo_id, '-', CAST(session_id AS STRING))) AS users
FROM sessions WHERE event_name = 'session_start'
UNION ALL
SELECT
  'page_view' AS step,
  COUNT(DISTINCT CONCAT(user_pseudo_id, '-', CAST(session_id AS STRING))) AS users
FROM sessions WHERE event_name = 'page_view'
UNION ALL
SELECT
  'add_to_cart' AS step,
  COUNT(DISTINCT CONCAT(user_pseudo_id, '-', CAST(session_id AS STRING))) AS users
FROM sessions WHERE event_name = 'add_to_cart'
UNION ALL
SELECT
  'begin_checkout' AS step,
  COUNT(DISTINCT CONCAT(user_pseudo_id, '-', CAST(session_id AS STRING))) AS users
FROM sessions WHERE event_name = 'begin_checkout'
UNION ALL
SELECT
  'purchase' AS step,
  COUNT(DISTINCT CONCAT(user_pseudo_id, '-', CAST(session_id AS STRING))) AS users
FROM sessions WHERE event_name = 'purchase'`,
  },
  {
    name: "ga4-attribution",
    service: "ga4",
    description: "Multi-touch attribution from raw events (source/medium per session)",
    params: ["project", "dataset", "start_date", "end_date"],
    sql: `WITH session_sources AS (
  SELECT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    COALESCE(
      (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'source'),
      traffic_source.source,
      '(direct)'
    ) AS source,
    COALESCE(
      (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'medium'),
      traffic_source.medium,
      '(none)'
    ) AS medium,
    MAX(CASE WHEN event_name = 'purchase' THEN 1 ELSE 0 END) AS has_purchase,
    SUM(CASE WHEN event_name = 'purchase' THEN ecommerce.purchase_revenue ELSE 0 END) AS revenue
  FROM \`{{project}}.{{dataset}}.events_*\`
  WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
  GROUP BY user_pseudo_id, session_id, source, medium
)
SELECT
  source,
  medium,
  COUNT(DISTINCT CONCAT(user_pseudo_id, '-', CAST(session_id AS STRING))) AS sessions,
  SUM(has_purchase) AS conversions,
  SUM(revenue) AS total_revenue
FROM session_sources
GROUP BY source, medium
ORDER BY sessions DESC
LIMIT 100`,
  },
  {
    name: "ga4-user-journey",
    service: "ga4",
    description: "Session-level user paths (page sequence per session)",
    params: ["project", "dataset", "start_date", "end_date"],
    sql: `WITH page_events AS (
  SELECT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    event_timestamp,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location
  FROM \`{{project}}.{{dataset}}.events_*\`
  WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
    AND event_name = 'page_view'
)
SELECT
  user_pseudo_id,
  session_id,
  COUNT(*) AS page_count,
  STRING_AGG(
    REGEXP_EXTRACT(page_location, r'https?://[^/]+(/.*)'),
    ' → '
    ORDER BY event_timestamp
  ) AS page_path
FROM page_events
GROUP BY user_pseudo_id, session_id
ORDER BY page_count DESC
LIMIT 500`,
  },
  {
    name: "ga4-ecommerce",
    service: "ga4",
    description: "Purchase and revenue with product-level detail from items array",
    params: ["project", "dataset", "start_date", "end_date"],
    sql: `SELECT
  event_date,
  user_pseudo_id,
  ecommerce.transaction_id,
  ecommerce.purchase_revenue,
  ecommerce.purchase_revenue_in_usd,
  ecommerce.total_item_quantity,
  item.item_id,
  item.item_name,
  item.item_brand,
  item.item_category,
  item.price,
  item.quantity,
  item.item_revenue
FROM \`{{project}}.{{dataset}}.events_*\`,
  UNNEST(items) AS item
WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
  AND event_name = 'purchase'
ORDER BY event_date DESC, ecommerce.purchase_revenue DESC
LIMIT 10000`,
  },
  {
    name: "ga4-retention",
    service: "ga4",
    description: "Weekly cohort retention from first visit",
    params: ["project", "dataset", "start_date", "end_date"],
    sql: `WITH user_first_visit AS (
  SELECT
    user_pseudo_id,
    MIN(PARSE_DATE('%Y%m%d', event_date)) AS first_visit_date
  FROM \`{{project}}.{{dataset}}.events_*\`
  WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
  GROUP BY user_pseudo_id
),
user_activity AS (
  SELECT DISTINCT
    user_pseudo_id,
    PARSE_DATE('%Y%m%d', event_date) AS activity_date
  FROM \`{{project}}.{{dataset}}.events_*\`
  WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
)
SELECT
  DATE_TRUNC(f.first_visit_date, WEEK) AS cohort_week,
  DATE_DIFF(a.activity_date, f.first_visit_date, WEEK) AS weeks_since_first_visit,
  COUNT(DISTINCT f.user_pseudo_id) AS users
FROM user_first_visit f
JOIN user_activity a ON f.user_pseudo_id = a.user_pseudo_id
GROUP BY cohort_week, weeks_since_first_visit
HAVING weeks_since_first_visit >= 0
ORDER BY cohort_week, weeks_since_first_visit`,
  },

  // --- Google Ads Templates ---
  {
    name: "ads-wasted-spend",
    service: "ads",
    description: "Search terms with spend and zero conversions",
    params: ["project", "dataset", "start_date", "end_date"],
    sql: `SELECT
  search_term_view_search_term AS search_term,
  SUM(metrics_impressions) AS impressions,
  SUM(metrics_clicks) AS clicks,
  SUM(metrics_cost_micros) / 1000000 AS cost,
  SUM(metrics_conversions) AS conversions
FROM \`{{project}}.{{dataset}}.ads_SearchQueryStats_*\`
WHERE _DATA_DATE BETWEEN '{{start_date}}' AND '{{end_date}}'
GROUP BY search_term
HAVING conversions = 0 AND cost > 0
ORDER BY cost DESC
LIMIT 100`,
  },
  {
    name: "ads-quality-trend",
    service: "ads",
    description: "Keyword quality score changes over time",
    params: ["project", "dataset", "start_date", "end_date"],
    sql: `SELECT
  _DATA_DATE AS date,
  ad_group_criterion_keyword_text AS keyword,
  ad_group_criterion_keyword_match_type AS match_type,
  ad_group_criterion_quality_info_quality_score AS quality_score,
  ad_group_criterion_quality_info_creative_quality_score AS creative_quality,
  ad_group_criterion_quality_info_post_click_quality_score AS landing_page_quality,
  ad_group_criterion_quality_info_search_predicted_ctr AS expected_ctr
FROM \`{{project}}.{{dataset}}.ads_Keyword_*\`
WHERE _DATA_DATE BETWEEN '{{start_date}}' AND '{{end_date}}'
  AND ad_group_criterion_quality_info_quality_score IS NOT NULL
ORDER BY keyword, date`,
  },
  {
    name: "ads-cross-campaign",
    service: "ads",
    description: "Cross-campaign performance comparison with cost and conversions",
    params: ["project", "dataset", "start_date", "end_date"],
    sql: `SELECT
  c.campaign_name,
  c.campaign_status,
  SUM(s.metrics_impressions) AS impressions,
  SUM(s.metrics_interactions) AS interactions,
  SUM(s.metrics_cost_micros) / 1000000 AS cost,
  SUM(s.metrics_conversions) AS conversions,
  SAFE_DIVIDE(SUM(s.metrics_cost_micros), SUM(s.metrics_conversions)) / 1000000 AS cost_per_conversion
FROM \`{{project}}.{{dataset}}.ads_CampaignBasicStats_*\` s
JOIN \`{{project}}.{{dataset}}.ads_Campaign_*\` c
  ON s.campaign_id = c.campaign_id AND s._DATA_DATE = c._DATA_DATE
WHERE s._DATA_DATE BETWEEN '{{start_date}}' AND '{{end_date}}'
GROUP BY c.campaign_name, c.campaign_status
ORDER BY cost DESC`,
  },

  // --- GSC Templates ---
  {
    name: "gsc-top-pages",
    service: "gsc",
    description: "Top pages by clicks with CTR and average position",
    params: ["project", "dataset", "start_date", "end_date"],
    sql: `SELECT
  url,
  SUM(clicks) AS clicks,
  SUM(impressions) AS impressions,
  SAFE_DIVIDE(SUM(clicks), SUM(impressions)) AS ctr,
  SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)) + 1 AS avg_position
FROM \`{{project}}.{{dataset}}.searchdata_url_impression\`
WHERE data_date BETWEEN '{{start_date}}' AND '{{end_date}}'
GROUP BY url
ORDER BY clicks DESC
LIMIT 100`,
  },
  {
    name: "gsc-query-clusters",
    service: "gsc",
    description: "Top queries grouped by volume (excludes anonymized)",
    params: ["project", "dataset", "start_date", "end_date"],
    sql: `SELECT
  query,
  SUM(clicks) AS clicks,
  SUM(impressions) AS impressions,
  SAFE_DIVIDE(SUM(clicks), SUM(impressions)) AS ctr,
  SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)) + 1 AS avg_position
FROM \`{{project}}.{{dataset}}.searchdata_site_impression\`
WHERE data_date BETWEEN '{{start_date}}' AND '{{end_date}}'
  AND is_anonymized_query = FALSE
GROUP BY query
ORDER BY impressions DESC
LIMIT 500`,
  },
  {
    name: "gsc-cannibalization",
    service: "gsc",
    description: "Queries with multiple competing pages (keyword cannibalization)",
    params: ["project", "dataset", "start_date", "end_date"],
    sql: `WITH query_pages AS (
  SELECT
    query,
    url,
    SUM(clicks) AS clicks,
    SUM(impressions) AS impressions,
    SAFE_DIVIDE(SUM(sum_top_position), SUM(impressions)) + 1 AS avg_position
  FROM \`{{project}}.{{dataset}}.searchdata_url_impression\`
  WHERE data_date BETWEEN '{{start_date}}' AND '{{end_date}}'
    AND is_anonymized_query = FALSE
  GROUP BY query, url
),
multi_page_queries AS (
  SELECT query, COUNT(DISTINCT url) AS page_count
  FROM query_pages
  WHERE impressions >= 10
  GROUP BY query
  HAVING page_count > 1
)
SELECT
  qp.query,
  m.page_count AS competing_pages,
  qp.url,
  qp.clicks,
  qp.impressions,
  ROUND(qp.avg_position, 1) AS avg_position
FROM query_pages qp
JOIN multi_page_queries m ON qp.query = m.query
ORDER BY m.page_count DESC, qp.query, qp.clicks DESC
LIMIT 500`,
  },
];

export function getTemplate(name: string): BqTemplate | undefined {
  return templates.find((t) => t.name === name);
}

export function listTemplates(service?: string): BqTemplate[] {
  if (service) {
    return templates.filter((t) => t.service === service);
  }
  return templates;
}

export function renderTemplate(
  template: BqTemplate,
  params: Record<string, string>
): string {
  let sql = template.sql;
  for (const [key, value] of Object.entries(params)) {
    sql = sql.replaceAll(`{{${key}}}`, value);
  }
  // Check for unreplaced placeholders
  const missing = sql.match(/\{\{(\w+)\}\}/g);
  if (missing) {
    const names = [...new Set(missing.map((m) => m.slice(2, -2)))];
    throw new Error(`Missing required parameters: ${names.join(", ")}`);
  }
  return sql;
}
