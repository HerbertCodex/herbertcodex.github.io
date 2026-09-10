#!/usr/bin/env node
/**
 * Computes what the site's policy allows, from the site as built, and writes
 * it twice from one source: the list of headers beside the served folder, and
 * the policy tags inside every prerendered page.
 *
 * The prerendered HTML carries inline scripts and style elements. A policy
 * without 'unsafe-inline' allows them only by the sha256 of their exact text,
 * and a hash copied by hand drifts at the first Solid upgrade: the site stops
 * hydrating and no unit test sees it. So the hashes are computed here, on
 * every build, and written nowhere else.
 *
 * Nothing here parses HTML in general. It reads the HTML the prerenderer
 * produces, and whatever it cannot read is refused rather than skipped: a
 * build that cannot compute the policy fails instead of shipping an empty one,
 * and no list is written, so nothing can serve that build as if it held.
 *
 * A style attribute is refused outright: only 'unsafe-hashes' could allow it,
 * and that keyword is what the security gate classifies Medium.
 *
 * Usage: node scripts/security-headers.mjs [root]
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const LIST_NAME = "security-headers.json";

const FRAME_ANCESTORS = "frame-ancestors 'none'";

/**
 * The headers whose value does not depend on the site, in the order the
 * contract lists them after the content policy.
 */
const FIXED_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

const HEADER_NAMES = ["Content-Security-Policy", ...Object.keys(FIXED_HEADERS)];

/**
 * A start tag, read with its quoted values so that a `>` inside one does not
 * end the tag early and hide a style attribute written after it.
 */
const START_TAG = /<([a-zA-Z][^\s/>]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/y;
const ATTRIBUTE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const END_TAG = /<\/[a-zA-Z][^\s/>]*\s*>/y;
const DOCTYPE = /<!doctype[^>]*>/iy;

/**
 * Browsers also close a comment on `--!>`: a scan waiting for `-->` alone
 * would read the markup that follows as commented out.
 */
const COMMENT_END = /--!?>/g;

/**
 * Where the text of a script or style element ends, which is the first
 * closing tag of its name whatever the text says: that text is what the
 * browser hashes.
 */
const RAW_TEXT_END = new Map([
  ["script", /<\/script(\s*>)?/gi],
  ["style", /<\/style(\s*>)?/gi],
]);

/**
 * A page is written back from its decoded text, so the decoding must be
 * exact: a lenient one turns every byte that is not UTF-8 into U+FFFD and the
 * page is rewritten outside its tags. A byte order mark is kept in the text so
 * that it is written back too.
 */
const UTF8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

function refusal(path, reason) {
  return new Error(`${path}: ${reason}`);
}

function matchAt(pattern, html, at) {
  pattern.lastIndex = at;
  return pattern.exec(html);
}

function listPathOf(root) {
  const served = resolve(root);
  if (dirname(served) === served) throw refusal(served, "a filesystem root has no outside to write the list to");
  return join(dirname(served), LIST_NAME);
}

function attributesOf(text) {
  const attributes = new Map();
  for (const [, name, ...values] of text.matchAll(ATTRIBUTE)) {
    const key = name.toLowerCase();
    if (!attributes.has(key)) attributes.set(key, values.find((value) => value !== undefined) ?? "");
  }
  return attributes;
}

/**
 * The browser tokenizes a script differently once its text holds `<!--`, and
 * normalizes a carriage return before hashing: in both cases the hash computed
 * here would not be the one it checks, and the element would be blocked.
 */
function withRawText(token, html, file) {
  const closing = matchAt(RAW_TEXT_END.get(token.name), html, token.end);
  if (closing === null || closing[1] === undefined) {
    throw refusal(file, `a <${token.name}> at offset ${token.at} whose end cannot be read`);
  }
  const text = html.slice(token.end, closing.index);
  if (text.includes("\r")) {
    throw refusal(file, `a <${token.name}> at offset ${token.at} whose text holds a carriage return`);
  }
  if (token.name === "script" && text.includes("<!--")) {
    throw refusal(file, `a <script> at offset ${token.at} whose text holds "<!--"`);
  }
  return { ...token, text, end: closing.index + closing[0].length };
}

function tokenAt(html, at, file) {
  if (html.startsWith("<!--", at)) {
    const close = matchAt(COMMENT_END, html, at + 2);
    if (close === null) throw refusal(file, `a comment at offset ${at} that never ends`);
    return { end: close.index + close[0].length };
  }
  const skipped = matchAt(DOCTYPE, html, at) ?? matchAt(END_TAG, html, at);
  if (skipped !== null) return { end: at + skipped[0].length };
  const tag = matchAt(START_TAG, html, at);
  if (tag === null) {
    throw refusal(file, `unreadable markup at offset ${at}: ${JSON.stringify(html.slice(at, at + 40))}`);
  }
  const token = { name: tag[1].toLowerCase(), attributes: attributesOf(tag[2]), at, end: at + tag[0].length };
  return RAW_TEXT_END.has(token.name) ? withRawText(token, html, file) : token;
}

function tagsOfPage(html, file) {
  const tags = [];
  for (let at = html.indexOf("<"); at !== -1;) {
    const token = tokenAt(html, at, file);
    if (token.name !== undefined) tags.push(token);
    at = html.indexOf("<", token.end);
  }
  return tags;
}

function isPolicyTag(tag) {
  if (tag.name !== "meta") return false;
  return (
    tag.attributes.get("http-equiv")?.toLowerCase() === "content-security-policy" ||
    tag.attributes.get("name")?.toLowerCase() === "referrer"
  );
}

/**
 * A policy written in a page governs nothing that precedes it, so the tags go
 * right after the charset and before any script. The hashes are computed on
 * UTF-8, which the charset must therefore declare. A policy tag already there
 * would stay in force beside the new one, and the stricter of the two would
 * win unseen.
 */
function insertionPoint(tags, file) {
  const charset = tags.find((tag) => tag.name === "meta" && tag.attributes.has("charset"));
  if (charset === undefined) throw refusal(file, "no <meta charset>, after which the policy tags go");
  if (charset.attributes.get("charset").toLowerCase() !== "utf-8") {
    throw refusal(file, "a charset other than utf-8, while the hashes are computed on utf-8");
  }
  if (tags.some((tag) => tag.name === "script" && tag.at < charset.at)) {
    throw refusal(file, "a <script> before <meta charset>, which a policy written after it would not govern");
  }
  if (tags.some(isPolicyTag)) {
    throw refusal(file, "a policy tag already, which would stay in force beside the computed one");
  }
  return charset.end;
}

function readPage(file) {
  const bytes = readFileSync(file);
  let html;
  try {
    html = UTF8.decode(bytes);
  } catch {
    throw refusal(file, "bytes that are not UTF-8, which the page written back could not keep as they are");
  }
  const tags = tagsOfPage(html, file);
  const styled = tags.find((tag) => tag.attributes.has("style"));
  if (styled !== undefined) {
    throw refusal(
      file,
      `a style attribute on <${styled.name}> at offset ${styled.at}, which only 'unsafe-hashes' could allow`,
    );
  }
  const scripts = tags.filter((tag) => tag.name === "script");
  const mixed = scripts.find((script) => script.attributes.has("src") && script.text !== "");
  if (mixed !== undefined) throw refusal(file, `a <script> at offset ${mixed.at} carrying both src and a text`);
  return {
    file,
    html,
    insertAt: insertionPoint(tags, file),
    scripts: scripts.filter((script) => !script.attributes.has("src")).map((script) => script.text),
    styles: tags.filter((tag) => tag.name === "style").map((style) => style.text),
  };
}

/**
 * A page that is a link is served from wherever it points: tagging it would
 * write outside the served folder, and skipping it would serve it with no
 * policy while the list says every page carries one.
 */
function pagesUnder(root) {
  const entries = readdirSync(root, { recursive: true, withFileTypes: true });
  // A linked directory is refused as a linked file already was: its pages
  // would be tagged by writing THROUGH the link, hence outside the folder the
  // host serves. Measured on 2026-09-10: a root whose `en` pointed elsewhere
  // reported `pages: 2` while modifying a file nothing serves.
  const linked = entries.find((entry) => entry.isSymbolicLink());
  if (linked !== undefined) {
    throw refusal(
      join(linked.parentPath, linked.name),
      "a link under the root: what it points at is not the folder being served",
    );
  }
  // A name that looks like a page without carrying the exact extension is
  // refused rather than skipped: `old.htm` and `INDEX.HTML` both slipped
  // through the filter, the list was written, and the page carried neither tag
  // nor hash. This module refuses what it cannot read; it never skips it.
  const missed = entries.find(
    (entry) => !entry.isDirectory() && /\.(html?|xhtml)$/i.test(entry.name) && !entry.name.endsWith(".html"),
  );
  if (missed !== undefined) {
    throw refusal(
      join(missed.parentPath, missed.name),
      "a page this cannot read: only a name ending in .html is tagged",
    );
  }
  const pages = entries.filter((entry) => entry.name.endsWith(".html") && !entry.isDirectory());
  const irregular = pages.find((entry) => !entry.isFile());
  if (irregular !== undefined) {
    throw refusal(join(irregular.parentPath, irregular.name), "a page that is not a regular file, such as a link");
  }
  return pages.map((entry) => join(entry.parentPath, entry.name)).sort();
}

/**
 * Sorted, so that two builds of the same source write the same list.
 */
function hashesOf(texts) {
  const hashes = new Set(texts.map((text) => `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`));
  return [...hashes].sort();
}

function policyOf(scriptHashes, styleHashes) {
  return [
    "default-src 'self'",
    ["script-src", "'self'", ...scriptHashes].join(" "),
    ["style-src", "'self'", ...styleHashes].join(" "),
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    FRAME_ANCESTORS,
  ].join("; ");
}

/**
 * The tags are derived from the headers rather than from the directives, so
 * that the page and the list cannot say two things. frame-ancestors is left
 * out because a tag cannot carry it, and a browser reports in its console the
 * directive it ignores.
 */
function tagsOf(headers) {
  const policy = headers["Content-Security-Policy"]
    .split("; ")
    .filter((directive) => directive !== FRAME_ANCESTORS)
    .join("; ");
  return (
    `<meta http-equiv="Content-Security-Policy" content="${policy}">` +
    `<meta name="referrer" content="${headers["Referrer-Policy"]}">`
  );
}

/**
 * Computes the policy of a built site, writes its tags into every page, then
 * writes the list of headers beside the served folder.
 *
 * Every page is read and judged before anything is written, and the list is
 * written last: a list that exists therefore describes pages that all carry
 * its tags.
 *
 * @param root - the served folder, whose pages are every `*.html` under it
 * @returns where the list was written, how many pages were tagged, and how many hashes each directive carries
 * @throws when there is no page, when a page is not a regular file or not
 *   UTF-8, when a page carries a style attribute, when a page cannot receive
 *   the tags before its first script, or when a page holds markup this
 *   calculation cannot read — always naming the file, and having written
 *   nothing
 */
export function writeSecurityHeaders(root) {
  const list = listPathOf(root);
  const pages = pagesUnder(root).map(readPage);
  if (pages.length === 0)
    throw refusal(resolve(root), "no page (*.html), and a policy computed on nothing holds nothing");
  const scriptHashes = hashesOf(pages.flatMap((page) => page.scripts));
  const styleHashes = hashesOf(pages.flatMap((page) => page.styles));
  const headers = { "Content-Security-Policy": policyOf(scriptHashes, styleHashes), ...FIXED_HEADERS };
  const tags = tagsOf(headers);
  for (const page of pages) {
    writeFileSync(page.file, page.html.slice(0, page.insertAt) + tags + page.html.slice(page.insertAt), "utf8");
  }
  writeFileSync(list, `${JSON.stringify(headers, null, 2)}\n`, "utf8");
  return { list, pages: pages.length, scriptHashes: scriptHashes.length, styleHashes: styleHashes.length };
}

/**
 * Reads the list of headers a build wrote beside a served folder.
 *
 * This is the only reader of the list, as `writeSecurityHeaders` is its only
 * writer: a server imports it rather than knowing where the list lives or how
 * it is written.
 *
 * @param root - the served folder the list was computed for
 * @returns the five headers, by name
 * @throws naming the list's path, when it is missing, unreadable, or does not
 *   carry exactly the five headers each with a value
 */
export function readSecurityHeaders(root) {
  const list = listPathOf(root);
  let headers;
  try {
    headers = JSON.parse(readFileSync(list, "utf8"));
  } catch (error) {
    throw refusal(list, `no readable list of headers (${error.message}); the build writes it`);
  }
  const complete =
    headers !== null &&
    typeof headers === "object" &&
    !Array.isArray(headers) &&
    Object.keys(headers).sort().join("\n") === [...HEADER_NAMES].sort().join("\n") &&
    Object.values(headers).every((value) => typeof value === "string" && value !== "");
  if (!complete) throw refusal(list, `a list that does not carry exactly ${HEADER_NAMES.join(", ")}`);
  // Refused HERE so the list at fault is named while nothing yet listens: a
  // refusal that arrives at the first answer names nothing a reader can act on.
  for (const [name, value] of Object.entries(headers)) {
    if (/[\r\n\0]/.test(value))
      throw refusal(list, `a value for ${name} that no header can carry: it holds a line break`);
  }
  return headers;
}

if (process.argv[1]?.endsWith("security-headers.mjs")) {
  const root = process.argv[2] ?? ".output/public";
  try {
    const written = writeSecurityHeaders(root);
    console.log(
      `security headers: ${written.pages} page(s) tagged, script-src ${written.scriptHashes} hash(es), ` +
        `style-src ${written.styleHashes} hash(es), list written to ${written.list}.`,
    );
  } catch (error) {
    console.error(`security headers: ${error.message}`);
    console.error("No list was written: this build carries no policy anything may serve.");
    process.exit(1);
  }
}
