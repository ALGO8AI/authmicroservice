import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const targets = [
  path.join(repoRoot, "tests", "reports", "coverage"),
  path.join(repoRoot, "tests", "reports", "jest"),
];

for (const target of targets) {
  fs.rmSync(target, { recursive: true, force: true });
}

fs.mkdirSync(path.join(repoRoot, "tests", "reports", "jest"), {
  recursive: true,
});
