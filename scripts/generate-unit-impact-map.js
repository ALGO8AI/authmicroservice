import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const reportRoot = path.join(repoRoot, "tests", "reports");
const markdownPath = path.join(reportRoot, "unit-impact-map.md");
const jsonPath = path.join(reportRoot, "unit-impact-map.json");

const INCLUDED_FILES = [
  "src/controllers/auth.controller.js",
  "src/controllers/healthcheck.controller.js",
  "src/controllers/oauth.controller.js",
  "src/controllers/upload.controller.js",
  "src/services/auth.service.js",
  "src/utils/ApiError.js",
  "src/utils/ApiResponse.js",
  "src/utils/asyncHandler.js",
  "src/utils/jwt.js",
  "src/utils/mail.js",
  "src/utils/otp.js",
  "src/utils/password.js",
  "src/validators/auth.validators.js",
  "src/validators/validate.js",
  "src/middlewares/auth.middlewares.js",
  "src/middlewares/error.middlewares.js",
  "src/middlewares/requestId.middleware.js"
];

const EXCLUDED_MODULES = [
  { module: "src/app.js", reason: "Application bootstrap and framework wiring only." },
  { module: "src/index.js", reason: "Process entrypoint only." },
  { module: "src/config/db.js", reason: "Real database bootstrap; excluded from unit scope." },
  { module: "src/routes/*.js", reason: "Route registration only; HTTP route tests are explicitly out of scope." },
  { module: "src/models/**/*.js", reason: "ORM models are persistence definitions, not unit-level business logic here." },
  { module: "src/queries/auth.queries.js", reason: "Thin ORM wrapper around Sequelize model calls; treated as downstream dependency." },
  { module: "src/logger/*.js", reason: "Logging infrastructure only." },
  { module: "src/middlewares/upload.middleware.js", reason: "Multer wiring/infrastructure; minimal repo-specific value compared with business-logic modules." },
  { module: "src/constants.js", reason: "Static constants only." }
];

const EXPORT_PATTERNS = [
  /export const (\w+)/g,
  /export async function (\w+)/g,
  /export function (\w+)/g,
  /export class (\w+)/g,
];

const parseExports = (content) => {
  const found = new Set();

  for (const pattern of EXPORT_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      found.add(match[1]);
    }
  }

  const exportListMatch = content.match(/export\s*{([^}]+)}/);
  if (exportListMatch) {
    exportListMatch[1]
      .split(",")
      .map((item) => item.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean)
      .forEach((name) => found.add(name));
  }

  if (/export default /m.test(content)) {
    found.add("default");
  }

  return [...found];
};

const parseImports = (content, relativeFile) => {
  const dependencies = new Set();
  const directory = path.dirname(relativeFile);

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*import\s+(?:.+?\s+from\s+)?["'](.+?)["'];?\s*$/u);
    if (!match) {
      continue;
    }

    const rawDependency = match[1];
    if (rawDependency.startsWith(".")) {
      const resolved = path.normalize(path.join(directory, rawDependency)).replace(/\\/g, "/");
      dependencies.add(resolved.endsWith(".js") ? resolved : `${resolved}.js`);
    } else {
      dependencies.add(rawDependency);
    }
  }

  return [...dependencies].sort();
};

const modules = INCLUDED_FILES.map((relativeFile) => {
  const absoluteFile = path.join(repoRoot, relativeFile);
  const content = fs.readFileSync(absoluteFile, "utf8");

  return {
    module: relativeFile,
    exports: parseExports(content),
    dependencies: parseImports(content, relativeFile),
  };
});

const dependencyToSources = new Map();
for (const entry of modules) {
  for (const exportedFunction of entry.exports) {
    const sourceFunction = `${entry.module}#${exportedFunction}`;
    for (const dependency of entry.dependencies) {
      if (!dependencyToSources.has(dependency)) {
        dependencyToSources.set(dependency, []);
      }
      dependencyToSources.get(dependency).push(sourceFunction);
    }
  }
}

const dependencyImpact = [...dependencyToSources.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([dependency, affectedFunctions]) => ({
    dependency,
    affectedFunctions: affectedFunctions.sort(),
  }));

const report = {
  generatedAt: new Date().toISOString(),
  includedModules: modules,
  dependencyImpact,
  excludedModules: EXCLUDED_MODULES,
};

const markdown = [
  "# Unit Dependency Impact Map",
  "",
  "## In Scope",
  "",
  ...modules.flatMap((entry) => [
    `### ${entry.module}`,
    "",
    `Exported functions: ${entry.exports.length > 0 ? entry.exports.join(", ") : "None detected"}`,
    `Direct dependencies: ${entry.dependencies.length > 0 ? entry.dependencies.join(", ") : "None"}`,
    "",
  ]),
  "## Dependency To Source Impact",
  "",
  ...dependencyImpact.flatMap((entry) => [
    `### ${entry.dependency}`,
    "",
    ...entry.affectedFunctions.map((item) => `- ${item}`),
    "",
  ]),
  "## Excluded Modules",
  "",
  ...EXCLUDED_MODULES.map((entry) => `- ${entry.module}: ${entry.reason}`),
  "",
].join("\n");

fs.mkdirSync(reportRoot, { recursive: true });
fs.writeFileSync(markdownPath, markdown);
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

console.log(`Unit impact map written to ${markdownPath}`);
console.log(`Unit impact map written to ${jsonPath}`);
