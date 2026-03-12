import { Command } from "commander";
import { login, logout, status, setCredentials } from "../lib/auth.js";

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
}
