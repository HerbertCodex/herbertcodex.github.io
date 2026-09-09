#!/usr/bin/env node
/**
 * Refuses a class name claimed by two stylesheets that own each other nothing.
 *
 * The stylesheets are global and loaded per route: the router injects the
 * sheet of a route as soon as it preloads it, and from that moment its rules
 * apply to every page already on screen. Two sheets naming the same class for
 * two unrelated objects therefore do not collide when they are read, but when
 * one of them happens to arrive — which no unit test and no single-page
 * screenshot reproduces, because both need the other route to be preloaded
 * first.
 *
 * The primitives sheet is the exception, and the only one: a name it declares
 * is a shared primitive, and a feature naming it again is extending it rather
 * than competing for it. That is the difference between `.links`, refined by
 * two features from one declaration, and `.mark`, which meant the wordmark in
 * the site bar and an "ongoing" badge in the journey — the same six letters
 * for two objects, and the bar repainted on every page on 2026-09-09.
 *
 * Usage: node scripts/check-css-ownership.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const CONFIG = "pipeline.config.json";

const CLASS = /\.(-?[_a-zA-Z][\w-]*)/g;

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
 * Returns the selector preludes of a stylesheet, at-rules excluded.
 *
 * Brace depth is tracked rather than matched by pattern, because a rule
 * inside a media query is nested and a pattern that pairs the first `{` with
 * the first `}` would read the query itself as a selector. What accumulates
 * between two braces is a prelude; what follows a prelude is a body, and the
 * body is never read — a class name mentioned in `content` or in a `url()`
 * declares nothing.
 *
 * @param source - the stylesheet text, comments already blanked
 * @returns one entry per rule, in file order, with the line it opens on
 */
function preludes(source) {
  const found = [];
  let buffer = "";
  let line = 1;
  for (const character of source) {
    if (character === "\n") line += 1;
    if (character === "{" || character === "}") {
      const prelude = buffer.trim();
      if (character === "{" && prelude.length > 0 && !prelude.startsWith("@")) {
        found.push({ prelude, line });
      }
      buffer = "";
    } else buffer += character;
  }
  return found;
}

/**
 * Returns the class names one stylesheet names in selector position.
 *
 * A comment is blanked rather than removed, its newlines kept: dropping them
 * would shift every line number after the first comment, and this file's
 * comments run to twenty lines. A gate that names the wrong line sends the
 * reader to a rule that is not the one it refused.
 *
 * @param path - the stylesheet being read
 * @returns a map from class name to the first line naming it
 */
function claims(path) {
  const source = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
  const named = new Map();
  for (const { prelude, line } of preludes(source)) {
    for (const match of prelude.matchAll(CLASS)) {
      if (!named.has(match[1])) named.set(match[1], line);
    }
  }
  return named;
}

/**
 * Reads the primitives sheet and the stylesheets it arbitrates between.
 *
 * @returns the primitives sheet path and the other stylesheets
 */
function settings() {
  const config = JSON.parse(readFileSync(CONFIG, "utf8"));
  const primitives = config.design_system?.primitives_sheet;
  if (typeof primitives !== "string" || !existsSync(primitives)) {
    console.error(`design_system.primitives_sheet does not name a readable file: ${primitives}`);
    process.exit(1);
  }

  const roots = config.project_map?.roots ?? ["src"];
  const stylesheets = roots
    .flatMap((root) => walk(root))
    .map((path) => path.split("\\").join("/"))
    .filter((path) => extname(path) === ".css")
    .filter((path) => path !== primitives);

  return { primitives, stylesheets };
}

/**
 * Reports the class names two stylesheets claim without a primitive to share.
 *
 * @param owned - the names the primitives sheet declares
 * @param byFile - each stylesheet with the names it claims
 * @returns one entry per contested name, with the files claiming it
 */
function contested(owned, byFile) {
  const holders = new Map();
  for (const { path, named } of byFile) {
    for (const [name, line] of named) {
      if (!holders.has(name)) holders.set(name, []);
      holders.get(name).push(`${path}:${line}`);
    }
  }
  return [...holders]
    .filter(([name, sites]) => sites.length > 1 && !owned.has(name))
    .map(([name, sites]) => ({ name, sites }));
}

function main() {
  const { primitives, stylesheets } = settings();
  const owned = claims(primitives);
  const byFile = stylesheets.map((path) => ({ path, named: claims(path) }));
  const total = new Set(byFile.flatMap(({ named }) => [...named.keys()]));

  const offences = contested(owned, byFile);
  if (offences.length > 0) {
    console.error(`css ownership: ${offences.length} classe(s) revendiquée(s) par deux feuilles sans primitive.\n`);
    console.error("Les feuilles sont globales et chargées par route : celle qui arrive la dernière gagne,");
    console.error("sur toutes les pages déjà affichées. Le défaut ne se voit donc qu'après un préchargement,");
    console.error("jamais sur la page seule.\n");
    for (const { name, sites } of offences) {
      console.error(`  .${name}`);
      for (const site of sites) console.error(`      ${site}`);
    }
    console.error(`\nRenommez-en une, ou déclarez la primitive dans ${primitives} et laissez les feuilles l'étendre.`);
    process.exit(1);
  }

  if (total.size === 0) {
    console.error(
      `${stylesheets.length} feuille(s) ne nomment aucune classe. Une porte qui n'a rien à comparer est ` +
        `verte à vide, ce qui se lit comme une preuve et n'en est pas une.`,
    );
    process.exit(1);
  }

  const shared = [...total].filter((name) => owned.has(name)).length;
  console.log(
    `css ownership: ${stylesheets.length} feuille(s), ${total.size} classe(s), ${shared} étendue(s) depuis ` +
      `${primitives}, aucune revendiquée deux fois.`,
  );
}

main();
