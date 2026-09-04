#!/usr/bin/env node
/**
 * Enforces the architecture declared in `pipeline.config.json`.
 *
 * The layout is a decision, and a decision that lives only in a rendered
 * page binds nobody: each agent lays the code out its own way and the drift
 * stays invisible because nothing states what it drifts from. This gate
 * reads the declaration itself — `architecture.layers` and
 * `architecture.allowed` — so the rule enforced and the rule written down
 * cannot diverge.
 *
 * The composition root is not a layer. `src/app.tsx` and the entry points
 * assemble the application and legitimately reach everywhere; counting them
 * as coupling would produce a permanent alarm, and a permanent alarm stops
 * being read.
 *
 * Usage: node scripts/check-architecture.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";

const CONFIG = "pipeline.config.json";
const SCANNED = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs"]);
const RESOLVED = [".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs", "/index.ts", "/index.tsx", ".css"];

/**
 * Files that assemble the application rather than belonging to a layer.
 *
 * Declared here rather than inferred: the set is small, and a heuristic
 * guessing at it would quietly exempt whatever it mistook for a root.
 */
const COMPOSITION_ROOT = new Set(["src/app.tsx", "src/entry-client.tsx", "src/entry-server.tsx", "src/global.d.ts"]);

/**
 * Turns a configured glob into an anchored regular expression.
 *
 * @param glob - a path pattern using `*` and `**`
 * @returns the equivalent expression, anchored at both ends
 */
function toPattern(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const body = escaped
    .replace(/\*\*\/?/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .split("\u0000")
    .join(".*");
  return new RegExp(`^${body}$`);
}

/**
 * Measures how specific a glob is, by the literal prefix it fixes.
 *
 * The shared glob and the feature glob both match a file under the shared
 * directory, and the answer that is wrong is the general one. Sorting by
 * literal prefix is what makes the shared layer win over the feature layer.
 *
 * @param glob - a path pattern
 * @returns the number of characters fixed before the first wildcard
 */
function specificity(glob) {
  const wildcard = glob.indexOf("*");
  return wildcard === -1 ? glob.length : wildcard;
}

/**
 * Returns every file under a directory, recursively.
 *
 * @param dir - directory to walk
 * @returns paths relative to the repository root
 */
function walk(dir) {
  if (!existsSync(dir)) return [];
  let out = [];
  for (const entry of readdirSync(dir).sort()) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out = out.concat(walk(path));
    else out.push(path);
  }
  return out;
}

/**
 * Names the layer a path belongs to, most specific declaration first.
 *
 * @param path - a repository-relative path
 * @param layers - the declared layers, each with its globs
 * @returns the layer name, or null when the path belongs to none
 */
function layerOf(path, layers) {
  const ranked = layers
    .flatMap(([name, globs]) => globs.map((glob) => ({ name, glob })))
    .sort((a, b) => specificity(b.glob) - specificity(a.glob));
  for (const { name, glob } of ranked) {
    if (toPattern(glob).test(path)) return name;
  }
  return null;
}

/**
 * Extracts the module specifiers a file imports.
 *
 * @param source - the file's text
 * @returns the specifiers, in order of appearance
 */
function importsIn(source) {
  const found = [];
  const statements = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*["']([^"']+)["']/g;
  const bare = /(?:^|\n)\s*import\s*["']([^"']+)["']/g;
  const dynamic = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  for (const pattern of [statements, bare, dynamic]) {
    let match;
    while ((match = pattern.exec(source)) !== null) found.push(match[1]);
  }
  return found;
}

/**
 * Resolves a specifier to a repository-relative path, or null if external.
 *
 * @param specifier - the imported module specifier
 * @param from - the importing file
 * @returns the resolved path, or null for a package import
 */
function resolveSpecifier(specifier, from) {
  let base = null;
  if (specifier.startsWith("~/")) base = join("src", specifier.slice(2));
  else if (specifier.startsWith(".")) base = relative(".", resolve(dirname(from), specifier));
  if (base == null) return null;
  base = base.split("\\").join("/");
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const extension of RESOLVED) {
    if (existsSync(base + extension)) return base + extension;
  }
  return base;
}

/**
 * Reads the declaration the gate enforces, refusing an empty one.
 *
 * @returns the architecture block, its layer entries and the scanned files
 */
function declaration() {
  const config = JSON.parse(readFileSync(CONFIG, "utf8"));
  const architecture = config.architecture ?? {};
  const layers = Object.entries(architecture.layers ?? {});

  if (layers.length === 0) {
    console.error(
      "architecture.layers missing from pipeline.config.json. The gate would enforce nothing, " +
        "and an architecture nothing enforces is an intention.",
    );
    process.exit(1);
  }

  const roots = config.project_map?.roots ?? ["src"];
  const files = roots
    .flatMap((root) => walk(root))
    .map((path) => path.split("\\").join("/"))
    .filter((path) => SCANNED.has(extname(path)));

  if (files.length === 0) {
    console.error(`no source file under ${roots.join(", ")}: the gate would check nothing.`);
    process.exit(1);
  }
  return { architecture, layers, files };
}

/**
 * Reports the imports one file makes that its layer may not reach.
 *
 * @param path - the importing file
 * @param from - the layer that file belongs to
 * @param layers - the declared layer entries
 * @param allowed - the declared directions
 * @returns the violations found, and how many cross-layer imports were read
 */
function inspect(path, from, layers, allowed) {
  const violations = [];
  let checked = 0;
  const reachable = allowed[from] ?? [];
  for (const specifier of importsIn(readFileSync(path, "utf8"))) {
    const target = resolveSpecifier(specifier, path);
    if (target == null) continue;
    const to = layerOf(target, layers);
    if (to == null || to === from) continue;
    checked += 1;
    if (!reachable.includes(to)) {
      violations.push(
        `${path}\n    imports ${specifier} (${to})\n    but ${from} may only reach: ${reachable.join(", ") || "nothing"}`,
      );
    }
  }
  return { violations, checked };
}

function main() {
  const { architecture, layers, files } = declaration();
  const allowed = architecture.allowed ?? {};
  const violations = [];
  let checked = 0;

  for (const path of files) {
    if (COMPOSITION_ROOT.has(path)) continue;
    const from = layerOf(path, layers);
    if (from == null) continue;
    const report = inspect(path, from, layers, allowed);
    violations.push(...report.violations);
    checked += report.checked;
  }

  if (violations.length > 0) {
    console.error(`architecture "${architecture.id}": ${violations.length} forbidden import(s).\n`);
    for (const violation of violations) console.error(`  ${violation}\n`);
    process.exit(1);
  }
  console.log(
    `architecture "${architecture.id}": ${files.length} file(s), ${checked} cross-layer import(s), all declared.`,
  );
}

main();
