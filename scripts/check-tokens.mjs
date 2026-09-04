#!/usr/bin/env node
/**
 * Refuses a colour, length or font stated outside the declared tokens.
 *
 * An agent that needs a colour to write anything reaches for a plausible
 * one, and plausible converges: the same near-black, the same blue, the same
 * Inter. Every such value is a second source of truth for something the
 * token file already answers, and the two only ever diverge in a screenshot.
 *
 * A reference through `var(--token)` counts as a value stated correctly, so
 * a stylesheet built the right way passes while one with no styling at all
 * has nothing to pass with — the two look alike to a naive counter and mean
 * opposite things.
 *
 * Usage: node scripts/check-tokens.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname, relative } from "node:path";

const CONFIG = "pipeline.config.json";

/**
 * Values that carry no design decision.
 *
 * `0` has no unit to get wrong, `1px` is a hairline every border uses, and
 * the CSS keywords are not measurements. Refusing them would push authors to
 * invent tokens for nothing, and a token file nobody believes in is worse
 * than a few literals.
 */
const NEUTRAL = new Set([
  "0",
  "0px",
  "1px",
  "100%",
  "50%",
  "auto",
  "none",
  "inherit",
  "initial",
  "unset",
  "currentColor",
  "transparent",
]);

const COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|lab)\s*\(/g;
const LENGTH = /(?<![\w-])(\d+(?:\.\d+)?)(px|rem|em|pt)\b/g;
const FONT_FAMILY = /(?<!-)\bfont-family\s*:\s*([^;}]*)/g;

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
 * Removes comments and at-rule preludes before scanning.
 *
 * A media query states a breakpoint, which is a value the layout owns rather
 * than a token the palette owns; scanning it would report a length nobody
 * can express as a colour or a spacing step.
 *
 * @param source - the stylesheet text
 * @returns the text with comments and at-rule preludes blanked out
 */
function strip(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@(?:media|supports|container)[^{]*\{/g, "{");
}

/**
 * Reports the values one stylesheet states without going through a token.
 *
 * Each line is read with its `var(...)` references removed first, so what
 * remains is exactly what the file states on its own. A declaration left
 * empty by that removal stated nothing of its own and is not reported.
 *
 * @param path - the stylesheet being read
 * @param source - its text, comments and at-rule preludes already removed
 * @returns one entry per stray colour, length or font family
 */
function stray(path, source) {
  const offences = [];
  source.split("\n").forEach((rawLine, index) => {
    const line = rawLine.replace(/var\([^)]*\)/g, "");
    const at = (kind, value) => offences.push({ path, line: index + 1, kind, value });
    for (const match of line.matchAll(COLOUR)) at("colour", match[0]);
    for (const match of line.matchAll(LENGTH)) {
      if (!NEUTRAL.has(match[0])) at("length", match[0]);
    }
    for (const match of line.matchAll(FONT_FAMILY)) {
      const stated = match[1].trim();
      if (stated.length > 0 && !NEUTRAL.has(stated)) at("font", stated);
    }
  });
  return offences;
}

/**
 * Reads the token file and the stylesheets that must reference it.
 *
 * @returns the token path, the declared token names and the stylesheets
 */
function settings() {
  const config = JSON.parse(readFileSync(CONFIG, "utf8"));
  const tokensPath = config.design_system?.tokens;
  if (typeof tokensPath !== "string" || !existsSync(tokensPath)) {
    console.error(`design_system.tokens does not name a readable file: ${tokensPath}`);
    process.exit(1);
  }

  const declared = [...readFileSync(tokensPath, "utf8").matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1]);
  if (declared.length === 0) {
    console.error(`${tokensPath} declares no token: there is nothing for the interface to reference.`);
    process.exit(1);
  }

  const roots = config.project_map?.roots ?? ["src"];
  const stylesheets = roots
    .flatMap((root) => walk(root))
    .map((path) => path.split("\\").join("/"))
    .filter((path) => extname(path) === ".css")
    .filter((path) => relative(tokensPath, path) !== "");

  return { tokensPath, declared, stylesheets };
}

function main() {
  const { tokensPath, declared, stylesheets } = settings();
  const offences = [];
  let references = 0;
  for (const path of stylesheets) {
    const source = strip(readFileSync(path, "utf8"));
    references += (source.match(/var\(\s*--[a-z0-9-]+/g) ?? []).length;
    offences.push(...stray(path, source));
  }

  if (offences.length > 0) {
    console.error(`design tokens: ${offences.length} value(s) tracing back to no declared token.\n`);
    for (const offence of offences) {
      console.error(`  ${offence.path}:${offence.line}  ${offence.kind}  ${offence.value}`);
    }
    console.error(`\nDeclare it in ${tokensPath}, then reference it with var(--name).`);
    process.exit(1);
  }

  if (stylesheets.length > 0 && references === 0) {
    console.error(
      `${stylesheets.length} stylesheet(s) reference no token at all. A file with no styling passes a naive ` +
        `counter for the same reason an empty map passes --check: there is nothing to be wrong.`,
    );
    process.exit(1);
  }

  console.log(
    `design tokens: ${declared.length} declared, ${stylesheets.length} stylesheet(s), ${references} reference(s), no stray value.`,
  );
}

main();
