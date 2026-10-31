import { getAuthClient, getAdsConfig } from "../../lib/auth.js";

export const ADS_API_VERSION = "v23";
export const ADS_BASE_URL = `https://googleads.googleapis.com/${ADS_API_VERSION}`;

export interface GaqlRow {
  [resource: string]: {
    [field: string]: unknown;
  };
}

export async function queryAds(customerId: string, query: string): Promise<GaqlRow[]> {
  const auth = getAuthClient();
  const adsConfig = getAdsConfig();

  if (!adsConfig.developerToken) {
    throw new Error(
      "Google Ads developer token not set. Run: gmp auth set-developer-token YOUR_TOKEN"
    );
  }

  const token = await auth.getAccessToken();
  if (!token.token) {
    throw new Error("Failed to get access token. Run: gmp auth login");
  }

  const cid = customerId.replace(/-/g, "");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token.token}`,
    "developer-token": adsConfig.developerToken,
    "Content-Type": "application/json",
  };

  if (adsConfig.loginCustomerId) {
    headers["login-customer-id"] = adsConfig.loginCustomerId;
  }

  const response = await fetch(`${ADS_BASE_URL}/customers/${cid}/googleAds:searchStream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Ads API error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as Array<{ results?: GaqlRow[] }>;
  const rows: GaqlRow[] = [];
  for (const batch of data) {
    if (batch.results) {
      rows.push(...batch.results);
    }
  }
  return rows;
}

export function extractField(row: GaqlRow, path: string): string {
  const [resource, ...fields] = path.split(".");
  let value: unknown = row[resource!];
  for (const field of fields) {
    if (value && typeof value === "object") {
      value = (value as Record<string, unknown>)[field];
    } else {
      return "";
    }
  }
  return String(value ?? "");
}

export function formatMicros(micros: string): string {
  const num = parseInt(micros);
  if (isNaN(num)) return micros;
  return (num / 1_000_000).toFixed(2);
}

export function formatRate(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return (num * 100).toFixed(2) + "%";
}

export function resolveOrderBy(
  sortField: string | undefined,
  order: string | undefined,
  fieldMap: Record<string, string>,
  defaultOrderBy: string
): string {
  if (!sortField) return defaultOrderBy;
  const gaqlField = fieldMap[sortField];
  if (!gaqlField) {
    throw new Error(`--sort "${sortField}" must be one of: ${Object.keys(fieldMap).join(", ")}`);
  }
  return `${gaqlField} ${order === "asc" ? "ASC" : "DESC"}`;
}
