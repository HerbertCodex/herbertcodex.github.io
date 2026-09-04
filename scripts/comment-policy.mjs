#!/usr/bin/env node
/**
 * Refuses narration in comments, and accepts contracts on exports.
 *
 * A comment that restates the line below it goes stale the first time that
 * line changes, and a stale comment is read as true. What earns a comment is
 * the contract of something a caller depends on, or a reason the code cannot
 * carry: why this order, why this exception. `doc_lint` checks that exports
 * carry a contract; this checks that nothing else carries a story.
 *
 * Usage: node scripts/comment-policy.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const CONFIG = "pipeline.config.json";
const SCANNED = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"]);

/**
 * Comment forms that are instructions to a tool rather than prose.
 *
 * A pragma is read by a machine, so the narration rule does not apply to it.
 */
const DIRECTIVE = /^\/\/\s*(eslint-|@ts-|prettier-|v8 ignore|c8 ignore|#|<reference)/;

/**
 * A line comment whose words merely repeat the code beneath it.
 *
 * The test is deliberately shallow: it fires on the openings narration
 * actually uses. A rule trying to judge every comment would either accept
 * everything or be argued with on every run.
 */
const NARRATION =
  /^\/\/\s*(set|get|creates?|initiali[sz]e|increment|decrement|loop|iterate|returns?|call|assign|declare|define|import|export|now|then|first|next|finally|adds?|removes?|updates?|checks?|handles?|stores?|saves?|renders?)\b/i;

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

function main() {
  const config = JSON.parse(readFileSync(CONFIG, "utf8"));
  const policy = config.comment_policy ?? {};
  const roots = policy.roots ?? ["src"];
  const skip = policy.skip == null ? null : new RegExp(policy.skip);

  const files = roots
    .flatMap((root) => walk(root))
    .filter((path) => SCANNED.has(extname(path)))
    .filter((path) => skip == null || !skip.test(path));

  if (files.length === 0) {
    console.error(`no source file under ${roots.join(", ")}: the policy would check nothing.`);
    process.exit(1);
  }

  const offences = [];
  for (const path of files) {
    const lines = readFileSync(path, "utf8").split("\n");
    let inBlock = false;
    lines.forEach((raw, index) => {
      const line = raw.trim();
      if (inBlock) {
        if (line.includes("*/")) inBlock = false;
        return;
      }
      if (line.startsWith("/*")) {
        if (!line.includes("*/")) inBlock = true;
        return;
      }
      if (!line.startsWith("//")) return;
      if (DIRECTIVE.test(line)) return;
      if (NARRATION.test(line)) offences.push(`${path}:${index + 1}  narration — ${line}`);
    });
  }

  if (offences.length > 0) {
    console.error(`comment policy: ${offences.length} narrating comment(s).`);
    console.error("A comment earns its place by carrying a contract or a reason, never by restating the code.\n");
    for (const offence of offences) console.error(`  ${offence}`);
    process.exit(1);
  }
  console.log(`comment policy: ${files.length} file(s), no narration.`);
}

main();
