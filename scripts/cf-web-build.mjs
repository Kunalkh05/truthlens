import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const envFile = path.resolve(".env.local");
const hadEnvFile = fs.existsSync(envFile);
const original = hadEnvFile ? fs.readFileSync(envFile, "utf8") : "";
const mode = hadEnvFile ? fs.statSync(envFile).mode : 0o600;
const isSecretName = (name) => /(?:API_KEY|API_TOKEN|ACCESS_TOKEN|SECRET|PASSWORD|MASTER_KEY)$/i.test(name);

function withoutSecrets(text) {
  return text.split(/\r?\n/).filter((line) => {
    const match = line.match(/^\s*(?:export\s+)?([^=\s]+)\s*=/);
    return !match || !isSecretName(match[1]);
  }).join("\n");
}

const childEnv = { ...process.env };
for (const name of Object.keys(childEnv)) {
  if (isSecretName(name)) delete childEnv[name];
}

if (hadEnvFile) fs.writeFileSync(envFile, withoutSecrets(original), { mode });
let status = 1;
try {
  const cli = path.resolve("node_modules/.bin/opennextjs-cloudflare");
  const result = spawnSync(cli, ["build"], { stdio: "inherit", env: childEnv });
  status = result.status ?? 1;
} catch (error) {
  console.error("Cloudflare web build could not start.");
  status = 1;
} finally {
  if (hadEnvFile) fs.writeFileSync(envFile, original, { mode });
}
process.exit(status);
