import { existsSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const workdir = path.resolve(
  process.env.DEPLOY_WORKDIR || process.env.DEV_DEPLOY_WORKDIR || repoRoot,
);
const shouldSyncGit =
  (process.env.DEPLOY_GIT_SYNC || process.env.DEV_DEPLOY_GIT_SYNC) === "true";
const deployRef = process.env.DEPLOY_REF || process.env.DEV_DEPLOY_REF;
const shouldInitDb =
  (process.env.DEPLOY_RUN_INIT_DB || process.env.DEV_DEPLOY_RUN_INIT_DB) ===
  "true";
const restartCommand =
  process.env.DEPLOY_RESTART_CMD || process.env.DEV_DEPLOY_RESTART_CMD;
const smokeUrl =
  process.env.DEPLOY_SMOKE_URL ||
  process.env.DEV_DEPLOY_SMOKE_URL ||
  `http://127.0.0.1:${process.env.PORT || "8080"}`;
const smokePath =
  process.env.DEPLOY_SMOKE_PATH ||
  process.env.DEV_DEPLOY_SMOKE_PATH ||
  "/api/v1/healthcheck";

function runCommand(command, args, options = {}) {
  console.log(`> ${command} ${args.join(" ")}`.trim());

  const result = spawnSync(command, args, {
    cwd: workdir,
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function runShellCommand(command) {
  console.log(`> ${command}`);

  const result = spawnSync(command, {
    cwd: workdir,
    stdio: "inherit",
    shell: true,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command}`);
  }
}

function main() {
  if (!existsSync(workdir)) {
    throw new Error(`Deployment working directory does not exist: ${workdir}`);
  }

  console.log(`Deploying from ${workdir}`);

  if (shouldSyncGit) {
    runCommand("git", ["fetch", "--all", "--prune"]);

    if (deployRef) {
      runCommand("git", ["checkout", deployRef]);
      runCommand("git", ["pull", "--ff-only"]);
    }
  } else if (deployRef) {
    console.log(
      "DEPLOY_REF was provided but git sync is not enabled; continuing with current checkout.",
    );
  }

  if (existsSync(path.join(workdir, "package-lock.json"))) {
    runCommand("npm", ["ci"]);
  } else {
    runCommand("npm", ["install"]);
  }

  if (shouldInitDb) {
    runCommand("npm", ["run", "init-db"]);
  }

  if (restartCommand) {
    runShellCommand(restartCommand);
  } else {
    console.log(
      "No restart command configured. Set DEPLOY_RESTART_CMD for PM2/systemd/service restart integration.",
    );
  }

  runCommand("npm", [
    "run",
    "smoke:test",
    "--",
    `--url=${smokeUrl}`,
    `--path=${smokePath}`,
  ]);

  console.log("Development deployment completed successfully.");
}

main();
