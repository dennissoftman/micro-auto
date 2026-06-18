import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { spawnSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const version = randomUUID();
const versionFile = path.join(rootDir, "public", "api", "version.json");
const nextBin = path.join(rootDir, "node_modules", "next", "dist", "bin", "next");

fs.mkdirSync(path.dirname(versionFile), { recursive: true });
fs.writeFileSync(
  versionFile,
  JSON.stringify(
    {
      version,
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);

const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: rootDir,
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_APP_VERSION: version,
  },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
