import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const runtimeEnv = process.env.NODE_ENV || "development";

const candidateFiles = [
  `.env.${runtimeEnv}.local`,
  runtimeEnv === "test" ? null : ".env.local",
  `.env.${runtimeEnv}`,
  ".env",
].filter(Boolean);

for (const relativePath of candidateFiles) {
  const absolutePath = path.join(repoRoot, relativePath);

  if (!fs.existsSync(absolutePath)) {
    continue;
  }

  dotenv.config({ path: absolutePath, override: false });
}
