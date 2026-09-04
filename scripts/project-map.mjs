#!/usr/bin/env node
/**
 * Generates the project map from the TypeScript compiler AST.
 *
 * The map is what the reuse note required of every addition is judged
 * against, so it has to cite the code as it is rather than as a pattern
 * matcher guesses it. Solid components are `export default function` or
 * `export const`, and both shapes carry their role in the documentation
 * line above them; a regular expression reads neither reliably across a
 * `.tsx` file, which is why this generator parses instead of matching.
 *
 * Two refusals matter more than the rendering: no source file found under
 * the configured roots, and no declaration recognised anywhere. Both mean
 * the generator walked a tree it does not understand, and a near-empty map
 * passes `--check` against its own emptiness.
 *
 * Usage: node scripts/project-map.mjs [--check]
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname } from "node:path";
import ts from "typescript";

const CONFIG = "pipeline.config.json";
const PARSED = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"]);
const NATURES = {
  ".css": "stylesheet",
  ".ico": "asset",
  ".png": "asset",
  ".svg": "asset",
  ".jpg": "asset",
  ".webp": "asset",
  ".json": "data",
  ".md": "document",
  ".txt": "document",
};

/**
 * The word each declaration kind is searched by.
 *
 * A table rather than a chain of tests: the chain was this file's most
 * complex function and said nothing the table does not.
 */
const NATURE_BY_KIND = new Map([
  [ts.SyntaxKind.FunctionDeclaration, "function"],
  [ts.SyntaxKind.ClassDeclaration, "class"],
  [ts.SyntaxKind.InterfaceDeclaration, "interface"],
  [ts.SyntaxKind.TypeAliasDeclaration, "type"],
  [ts.SyntaxKind.EnumDeclaration, "enum"],
]);

/**
 * Stops with a message naming the setting to fix.
 *
 * A bare failure reads as a broken framework, and the reader then looks in
 * the wrong place.
 *
 * @param message - what failed, and which setting repairs it
 */
function fail(message) {
  console.error(message);
  process.exit(1);
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
 * Reads the documentation line attached to a declaration.
 *
 * The role a declaration plays is written in its documentation, not in its
 * name: `Counter` says nothing that `A counter button demonstrating local
 * signal state` does not say better. Only the first sentence is kept, since
 * the map is read to answer "does this already exist?".
 *
 * @param node - the declaration node
 * @param source - the file the node belongs to
 * @returns the first documentation sentence, or an empty string
 */
function docLine(node, source) {
  const text = source.getFullText();
  const ranges = ts.getLeadingCommentRanges(text, node.getFullStart()) ?? [];
  const block = ranges.filter((range) => text.slice(range.pos, range.pos + 3) === "/**").pop();
  if (block == null) return "";
  const body = text
    .slice(block.pos + 3, block.end - 2)
    .split("\n")
    .map((line) => line.replace(/^\s*\*?\s?/, "").trim())
    .filter((line) => line.length > 0 && !line.startsWith("@"));
  if (body.length === 0) return "";
  return body
    .join(" ")
    .split(/(?<=\.)\s/)[0]
    .trim();
}

/**
 * Names the nature of a declaration in the vocabulary a reader searches by.
 *
 * @param node - the declaration node
 * @returns a single word: function, class, constant, type, interface, enum
 */
function nature(node) {
  const known = NATURE_BY_KIND.get(node.kind);
  if (known != null) return known;
  if (!ts.isVariableStatement(node)) return "export";
  const initializer = node.declarationList.declarations[0]?.initializer;
  if (initializer == null) return "constant";
  return ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer) ? "function" : "constant";
}

/**
 * Collects the names one exported statement publishes.
 *
 * @param node - an exported statement
 * @param source - the file it belongs to
 * @returns the published entries, with nature and documentation
 */
function entriesOf(node, source) {
  const doc = docLine(node, source);
  const kind = nature(node);
  if (ts.isVariableStatement(node)) {
    return node.declarationList.declarations.map((declaration) => ({
      name: declaration.name.getText(source),
      nature: kind,
      doc,
    }));
  }
  const modifiers = ts.getModifiers(node) ?? [];
  const isDefault = modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword);
  const name = node.name?.getText(source) ?? (isDefault ? "default" : "");
  return name.length === 0 ? [] : [{ name, nature: kind, doc, default: isDefault }];
}

/**
 * Collects the public exports of one parsed file.
 *
 * A default export is reported under the name the file gives it when it has
 * one, and under `default` otherwise: a route module exports its component
 * anonymously often enough that dropping it would hide whole pages.
 *
 * @param path - the file to parse
 * @returns the exported declarations, with nature and documentation
 */
function exportsOf(path) {
  const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const found = [];
  for (const node of source.statements) {
    const modifiers = ts.canHaveModifiers(node) ? (ts.getModifiers(node) ?? []) : [];
    if (modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      found.push(...entriesOf(node, source));
      continue;
    }
    if (!ts.isExportAssignment(node) || node.isExportEquals) continue;
    const name = ts.isIdentifier(node.expression) ? node.expression.getText(source) : "default";
    if (!found.some((entry) => entry.name === name)) {
      found.push({ name, nature: "export", doc: docLine(node, source), default: true });
    }
  }
  return found;
}

/**
 * Renders one file's section of the map.
 *
 * @param file - a collected file with its exports or its nature
 * @returns the lines describing it
 */
function renderFile(file) {
  const lines = [`### ${file.path}`, ""];
  if (file.nature != null) return [...lines, `- ${file.nature}`, ""];
  if (file.exports.length === 0) return [...lines, "- no public export", ""];
  for (const entry of file.exports) {
    const role = entry.doc.length > 0 ? ` — ${entry.doc}` : "";
    const mark = entry.default === true ? " (default)" : "";
    lines.push(`- \`${entry.name}\`${mark} — ${entry.nature}${role}`);
  }
  return [...lines, ""];
}

/**
 * Renders the map as Markdown, grouped by directory.
 *
 * Every source file is cited whether or not it exports anything, because a
 * file absent from the map is a file the reuse note cannot be judged
 * against, and a stylesheet is as reusable as a helper.
 *
 * @param files - the collected files with their exports
 * @returns the Markdown document
 */
function render(files) {
  const groups = new Map();
  for (const file of files) {
    const dir = file.path.split("/").slice(0, -1).join("/") || ".";
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir).push(file);
  }
  const lines = [
    "# Project map",
    "",
    "Generated by `scripts/project-map.mjs` from the TypeScript AST. Do not edit by hand:",
    "`pnpm run project-map -- --check` refuses a map that no longer matches the code.",
    "",
    "Read it before creating a module, a component or a helper. The reuse note",
    "required of every addition is judged against this document.",
    "",
  ];
  for (const dir of [...groups.keys()].sort()) {
    lines.push(`## ${dir}`, "");
    for (const file of groups.get(dir).sort((a, b) => a.path.localeCompare(b.path))) {
      lines.push(...renderFile(file));
    }
  }
  return (
    lines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd() + "\n"
  );
}

/**
 * Reads the map settings, refusing a configuration that maps nothing.
 *
 * @returns the output path and the collected source paths
 */
function collect() {
  if (!existsSync(CONFIG)) fail(`not found: ${CONFIG}`);
  const config = JSON.parse(readFileSync(CONFIG, "utf8"));
  const settings = config.project_map ?? {};
  if (typeof settings.out !== "string") fail("project_map.out missing from pipeline.config.json");
  const roots = settings.roots ?? ["src"];
  const skip = settings.skip == null ? null : new RegExp(settings.skip);
  const paths = roots
    .flatMap((root) => walk(root))
    .map((path) => relative(".", path).split("\\").join("/"))
    .filter((path) => skip == null || !skip.test(path))
    .sort();

  if (paths.length === 0) {
    fail(
      `no file found under ${roots.join(", ")}. The map would cover nothing, and an empty map passes ` +
        `--check against its own emptiness. Check project_map.roots and project_map.skip.`,
    );
  }
  return { out: settings.out, roots, paths };
}

/**
 * Parses every collected path, refusing a tree the generator cannot read.
 *
 * @param paths - the source paths to describe
 * @returns the described files and the number of declarations recognised
 */
function describe(paths) {
  const files = [];
  let declarations = 0;
  for (const path of paths) {
    const extension = extname(path);
    if (!PARSED.has(extension)) {
      files.push({ path, nature: NATURES[extension] ?? "file" });
      continue;
    }
    const collected = exportsOf(path);
    declarations += collected.length;
    files.push({ path, exports: collected });
  }
  if (declarations === 0) {
    fail(
      `not one declaration recognised across ${paths.length} file(s). The generator parsed a tree it does ` +
        `not understand, and the map it would write asserts nothing. Check project_map.roots.`,
    );
  }
  return { files, declarations };
}

function main() {
  const { out, paths } = collect();
  const { files, declarations } = describe(paths);
  const rendered = render(files);

  if (process.argv.includes("--check")) {
    if (!existsSync(out)) fail(`${out} does not exist. Run: pnpm run project-map`);
    if (readFileSync(out, "utf8") !== rendered) {
      fail(`${out} is stale: it no longer matches the code. Run: pnpm run project-map`);
    }
    console.log(`${out} up to date (${paths.length} files, ${declarations} exports)`);
    return;
  }
  writeFileSync(out, rendered);
  console.log(`${out} written (${paths.length} files, ${declarations} exports)`);
}

main();
