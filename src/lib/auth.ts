import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";

const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/tagmanager.readonly",
];

// Default OAuth client (users can override with their own)
const DEFAULT_CLIENT_ID =
  "YOUR_CLIENT_ID"; // TODO: register a GCP OAuth app
const DEFAULT_CLIENT_SECRET = "YOUR_CLIENT_SECRET";
const REDIRECT_URI = "http://localhost:3847/callback";

function getConfigDir(): string {
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

function getTokenPath(): string {
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

function createOAuth2Client(): OAuth2Client {
  const { clientId, clientSecret } = getClientCredentials();
  return new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
}

export async function login(): Promise<void> {
  const oauth2Client = createOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  // Start local server to catch the callback
  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url || "", `http://localhost:3847`);
        const authCode = url.searchParams.get("code");
        if (authCode) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            "<h1>Authentication successful!</h1><p>You can close this window.</p>"
          );
          server.close();
          resolve(authCode);
        } else {
          res.writeHead(400);
          res.end("No code received");
        }
      } catch (err) {
        reject(err);
      }
    });

    server.listen(3847, () => {
      console.log(`\nOpening browser for authentication...\n`);
      console.log(`If the browser doesn't open, visit:\n${authUrl}\n`);
      import("open").then((open) => open.default(authUrl));
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("Authentication timed out"));
    }, 120000);
  });

  const { tokens } = await oauth2Client.getToken(code);
  fs.writeFileSync(getTokenPath(), JSON.stringify(tokens, null, 2));
  console.log("Authentication successful! Tokens saved.");
}

export function getAuthClient(): OAuth2Client {
  const tokenPath = getTokenPath();
  if (!fs.existsSync(tokenPath)) {
    throw new Error(
      "Not authenticated. Run `gmp auth login` first."
    );
  }

  const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens);

  // Auto-refresh: save new tokens when refreshed
  oauth2Client.on("tokens", (newTokens) => {
    const existing = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
    const merged = { ...existing, ...newTokens };
    fs.writeFileSync(tokenPath, JSON.stringify(merged, null, 2));
  });

  return oauth2Client;
}

export function isAuthenticated(): boolean {
  return fs.existsSync(getTokenPath());
}

export function logout(): void {
  const tokenPath = getTokenPath();
  if (fs.existsSync(tokenPath)) {
    fs.unlinkSync(tokenPath);
    console.log("Logged out. Tokens removed.");
  } else {
    console.log("No tokens found.");
  }
}

export function setCredentials(clientId: string, clientSecret: string): void {
  const credPath = getCredentialsPath();
  fs.writeFileSync(
    credPath,
    JSON.stringify({ clientId, clientSecret }, null, 2)
  );
  console.log(`Credentials saved to ${credPath}`);
}

export function status(): void {
  const tokenPath = getTokenPath();
  if (!fs.existsSync(tokenPath)) {
    console.log("Status: Not authenticated");
    return;
  }
  const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
  const expiry = tokens.expiry_date
    ? new Date(tokens.expiry_date).toISOString()
    : "unknown";
  console.log("Status: Authenticated");
  console.log(`Token expiry: ${expiry}`);
  console.log(`Scopes: ${tokens.scope || "unknown"}`);
}
