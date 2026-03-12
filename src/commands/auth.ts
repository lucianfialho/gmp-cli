import { Command } from "commander";
import { login, logout, status, setCredentials, setDeveloperToken, setLoginCustomerId } from "../lib/auth.js";

export function registerAuthCommand(program: Command): void {
  const auth = program.command("auth").description("Manage authentication");

  auth
    .command("login")
    .description("Authenticate with Google via OAuth")
    .action(async () => {
      try {
        await login();
      } catch (err) {
        console.error("Login failed:", (err as Error).message);
        process.exit(1);
      }
    });

  auth
    .command("logout")
    .description("Remove stored tokens")
    .action(() => {
      logout();
    });

  auth
    .command("status")
    .description("Show authentication status")
    .action(() => {
      status();
    });

  auth
    .command("set-credentials")
    .description("Set custom OAuth client ID and secret")
    .requiredOption("--client-id <id>", "OAuth client ID")
    .requiredOption("--client-secret <secret>", "OAuth client secret")
    .action((opts) => {
      setCredentials(opts.clientId, opts.clientSecret);
    });

  auth
    .command("set-developer-token")
    .description("Set Google Ads developer token")
    .argument("<token>", "Developer token from ads.google.com/aw/apicenter")
    .action((token: string) => {
      setDeveloperToken(token);
    });

  auth
    .command("set-login-customer-id")
    .description("Set Google Ads Manager Account (MCC) login customer ID")
    .argument("<id>", "Manager account customer ID (e.g. 1234567890)")
    .action((id: string) => {
      setLoginCustomerId(id);
    });
}
