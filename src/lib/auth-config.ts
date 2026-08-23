import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as fs from "fs";
import * as path from "path";

export const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/tagmanager.readonly",
  "https://www.googleapis.com/auth/adwords",
  "https://www.googleapis.com/auth/bigquery.readonly",
  "https://www.googleapis.com/auth/content",
  "https://www.googleapis.com/auth/youtube.readonly",
];

// Default OAuth client (users can override with their own)
const DEFAULT_CLIENT_ID =
  "YOUR_CLIENT_ID"; // TODO: register a GCP OAuth app
const DEFAULT_CLIENT_SECRET = "YOUR_CLIENT_SECRET";
export const REDIRECT_URI = "http://localhost:3847/callback";

export function getConfigDir(): string {
  const dir = path.join(
    process.env.HOME || process.env.USERPROFILE || ".",
    ".config",
    "gmp-cli"
  );
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getTokenPath(): string {
  return path.join(getConfigDir(), "tokens.json");
}

function getCredentialsPath(): string {
  return path.join(getConfigDir(), "credentials.json");
}

interface StoredCredentials {
  clientId: string;
  clientSecret: string;
}

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const credPath = getCredentialsPath();
  if (fs.existsSync(credPath)) {
    const creds: StoredCredentials = JSON.parse(
      fs.readFileSync(credPath, "utf-8")
    );
    return { clientId: creds.clientId, clientSecret: creds.clientSecret };
  }
  return { clientId: DEFAULT_CLIENT_ID, clientSecret: DEFAULT_CLIENT_SECRET };
}

export function createOAuth2Client(): OAuth2Client {
  const { clientId, clientSecret } = getClientCredentials();
  return new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
}

export function setCredentials(clientId: string, clientSecret: string): void {
  const credPath = getCredentialsPath();
  fs.writeFileSync(
    credPath,
    JSON.stringify({ clientId, clientSecret }, null, 2)
  );
  console.log(`Credentials saved to ${credPath}`);
}

function getAdsConfigPath(): string {
  return path.join(getConfigDir(), "ads.json");
}

interface AdsConfig {
  developerToken?: string;
  loginCustomerId?: string;
}

export function setDeveloperToken(token: string): void {
  const configPath = getAdsConfigPath();
  let config: AdsConfig = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
  config.developerToken = token;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`Developer token saved to ${configPath}`);
}

export function setLoginCustomerId(id: string): void {
  const configPath = getAdsConfigPath();
  let config: AdsConfig = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
  config.loginCustomerId = id.replace(/-/g, "");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`Login customer ID saved to ${configPath}`);
}

export function getAdsConfig(): AdsConfig {
  const configPath = getAdsConfigPath();
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
  return {};
}
