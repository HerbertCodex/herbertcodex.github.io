#!/usr/bin/env node
/**
 * Refuses a credential written into the tree.
 *
 * A key committed once is a key to rotate, whatever a later deletion says:
 * the history keeps it. The gate therefore runs before the commit exists,
 * from the pre-commit hook, rather than reporting it afterwards.
 *
 * Usage: node scripts/scan-secrets.mjs [path...]
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const CONFIG = "pipeline.config.json";

const IGNORED = new Set([
  "node_modules",
  "agent-pipeline",
  ".git",
  "dist",
  "build",
  "coverage",
  ".output",
  ".vinxi",
  ".nitro",
  ".wrangler",
]);

/**
 * Paths the scan skips because nothing in them is this project's to fix.
 *
 * They are read from the configuration rather than listed here: the briefs,
 * the prompts and the skills are copies `apply-profile` writes from the
 * vendored core, and the core is not modified. The first run reported an
 * example credential inside the security skill's own reference page — a
 * finding whose reader can do nothing but learn to skip the gate.
 *
 * The store and the handoffs are excluded for the other reason: they are
 * pipeline data, not source, and a scan reporting them would fire on
 * whatever an agent happened to record.
 *
 * @returns the repository-relative prefixes to leave alone
 */
function generatedPrefixes() {
  if (!existsSync(CONFIG)) return ["pipeline/store"];
  const config = JSON.parse(readFileSync(CONFIG, "utf8"));
  return ["skills_dir", "briefs_dir", "prompts_dir", "store_dir", "handoffs_dir"]
    .map((key) => config[key])
    .filter((value) => typeof value === "string" && value.length > 0)
    .map((value) => value.replace(/\/+$/, ""));
}
const BINARY = new Set([".ico", ".png", ".jpg", ".jpeg", ".webp", ".woff", ".woff2", ".ttf", ".pdf", ".gz", ".zip"]);

/**
 * Credential shapes, each anchored on the issuer's own prefix.
 *
 * Anchoring on the prefix rather than on entropy is what keeps the gate
 * quiet enough to stay read: a base64 blob is not a secret, and a rule
 * saying otherwise is switched off within a week.
 */
const PATTERNS = [
  { name: "AWS access key id", pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { name: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { name: "Slack token", pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "Stripe secret key", pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/ },
  { name: "Google API key", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "private key block", pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: "JSON web token", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  {
    name: "assigned credential",
    pattern: /\b(?:api[_-]?key|secret|password|passwd|token|client[_-]?secret)\b\s*[:=]\s*["'][^"'\s${}]{12,}["']/i,
  },
];

/**
 * Marker accepting one line as a deliberate example.
 *
 * Without an escape hatch the gate is disabled wholesale the first time a
 * fixture needs a key-shaped string, and a disabled gate protects nothing.
 */
const ALLOWED = /pipeline:allow-secret/;

/**
 * Returns every file under a directory, recursively, skipping build output.
 *
 * @param dir - directory to walk
 * @returns paths relative to the repository root
 */
function walk(dir) {
  if (!existsSync(dir)) return [];
  let out = [];
  for (const entry of readdirSync(dir).sort()) {
    if (IGNORED.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out = out.concat(walk(path));
    else out.push(path);
  }
  return out;
}

function main() {
  const skipped = generatedPrefixes();
  const targets = process.argv.slice(2);
  const files = (
    targets.length > 0
      ? targets.flatMap((target) => (statSync(target).isDirectory() ? walk(target) : [target]))
      : walk(".")
  )
    .filter((path) => !BINARY.has(extname(path)))
    .filter((path) => !skipped.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)));

  const findings = [];
  for (const path of files) {
    let content;
    try {
      content = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    if (content.includes("\u0000")) continue;
    content.split("\n").forEach((line, index) => {
      if (ALLOWED.test(line)) return;
      for (const { name, pattern } of PATTERNS) {
        if (pattern.test(line)) findings.push(`${path}:${index + 1}  ${name}`);
      }
    });
  }

  if (findings.length > 0) {
    console.error(`secrets scan: ${findings.length} candidate credential(s).`);
    console.error("Rotate the key, remove it from the tree, and read it from the environment instead.\n");
    for (const finding of findings) console.error(`  ${finding}`);
    process.exit(1);
  }
  console.log(`secrets scan: ${files.length} file(s), nothing found.`);
}

main();
