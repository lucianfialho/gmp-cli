import * as fs from "fs";
import * as path from "path";
import { getConfigDir } from "./auth-config.js";

interface DefaultsConfig {
  property?: string;
  account?: string;
}

function getDefaultsConfigPath(): string {
  return path.join(getConfigDir(), "defaults.json");
}

function readDefaultsConfig(): DefaultsConfig {
  const configPath = getDefaultsConfigPath();
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
  return {};
}

function writeDefaultsConfig(config: DefaultsConfig): void {
  fs.writeFileSync(getDefaultsConfigPath(), JSON.stringify(config, null, 2));
}

export function setDefaultProperty(id: string): void {
  const config = readDefaultsConfig();
  config.property = id;
  writeDefaultsConfig(config);
  console.log(`Default property set to ${id}`);
}

export function getDefaultProperty(): string | undefined {
  return readDefaultsConfig().property;
}

export function setDefaultAccount(id: string): void {
  const config = readDefaultsConfig();
  config.account = id;
  writeDefaultsConfig(config);
  console.log(`Default account set to ${id}`);
}

export function getDefaultAccount(): string | undefined {
  return readDefaultsConfig().account;
}

export function showDefaults(): void {
  const config = readDefaultsConfig();
  console.log(`property: ${config.property || "(not set)"}`);
  console.log(`account:  ${config.account || "(not set)"}`);
}

export function resolveProperty(explicit?: string): string {
  const value = explicit || getDefaultProperty();
  if (!value) {
    throw new Error(
      "No property ID given. Pass -p/--property or run `gmp config set property <id>`."
    );
  }
  return value;
}

export function resolveAccount(explicit?: string): string {
  const value = explicit || getDefaultAccount();
  if (!value) {
    throw new Error(
      "No account ID given. Pass -a/--account or run `gmp config set account <id>`."
    );
  }
  return value;
}
