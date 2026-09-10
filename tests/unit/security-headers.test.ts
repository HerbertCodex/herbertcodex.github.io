import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { readSecurityHeaders, writeSecurityHeaders } from "../../scripts/security-headers.mjs";

const CHARSET = '<meta charset="utf-8">';
const HYDRATION = "window._$HY||(e=>{e.events=[];e.completed=new WeakSet})(window._$HY={});";
const ROUTER = 'self.$R=self.$R||[];_$HY.r["0-réalisations"]={v:1};';
const QUOTING = "const probe = '<i style=\"color: red\">';";
const PATHS = '.work-dot{offset-path:path("M0 0 L10 10")}';
const SHEET = ".other{color:currentColor}";
const REFUSED = "fr/parcours/index.html";

function page(head = "", body = ""): string {
  return (
    `<!DOCTYPE html><html lang="fr"><head>${CHARSET}<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<link rel="icon" href="/favicon.ico"><script src="/theme.js"></script><script>${HYDRATION}</script>${head}</head>` +
    `<body><!--$--><main data-hk="0">${body}</main><!--/--><script type="module" async src="/_build/entry.js"></script></body></html>`
  );
}

const VALID: Record<string, string> = {
  "index.html": page(`<script>${ROUTER}</script>`),
  "fr/realisations/index.html": page(
    `<script>${ROUTER}</script><style data-sm="0001">${PATHS}</style>`,
    '<svg viewBox="0 0 10 10"><path d="M0 0 L10 10"/></svg>',
  ),
  "en/work/index.html": page(`<style data-sm="0001">${PATHS}</style>`),
  [REFUSED]: page(
    `<style>${SHEET}</style>`,
    `<p data-note='a style="b"' title="x > y">text</p><script>${QUOTING}</script>`,
  ),
  "_build/entry.js": "export {};",
};

const STYLED = [
  ["a plain style attribute", '<div style="color: red">x</div>'],
  ["a style attribute written in capitals", '<div STYLE="color: red">x</div>'],
  ["an unquoted style attribute", "<div style=color:red>x</div>"],
  ["a style attribute after a quoted '>'", '<p title="x>y" style="color: red">x</p>'],
  ["a style attribute on a self-closed svg element", '<svg><circle r="1" style="fill: red"/></svg>'],
];

const UNPLACEABLE = [
  ["no <meta charset>", page().replace(CHARSET, "")],
  ["a script before its <meta charset>", page().replace(CHARSET, `<script src="/early.js"></script>${CHARSET}`)],
  ["a content policy tag already", page(`<meta http-equiv="Content-Security-Policy" content="default-src 'self'">`)],
  ["a referrer policy tag already", page('<meta name="referrer" content="no-referrer">')],
];

/**
 * Saved as Latin-1, so the paragraph reads "caf", 0xE9, a space, then 0xFF:
 * bytes no UTF-8 decoder accepts.
 */
const UNDECODABLE = Buffer.from(page("", "<p>café ÿ</p>"), "latin1");

const UNREADABLE: [string, () => string][] = [
  ["whose bytes are not UTF-8", () => siteOf({ ...VALID, [REFUSED]: UNDECODABLE })],
  ["that is a symbolic link to a page outside the folder", linkedSite],
];

const sites: string[] = [];

afterEach(() => {
  for (const site of sites.splice(0)) rmSync(site, { recursive: true, force: true });
});

function siteOf(files: Record<string, string | Buffer>): string {
  const parent = mkdtempSync(join(tmpdir(), "security-headers-"));
  sites.push(parent);
  for (const [path, text] of Object.entries(files)) {
    const file = join(parent, "public", path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text, "utf8");
  }
  return join(parent, "public");
}

function linkedSite(): string {
  const root = siteOf(VALID);
  const outside = siteOf({ "index.html": page() });
  rmSync(join(root, REFUSED));
  symlinkSync(join(outside, "index.html"), join(root, REFUSED));
  return root;
}

function besideRoot(root: string): string[] {
  return readdirSync(dirname(root));
}

function bytesUnder(root: string): Record<string, Buffer> {
  return Object.fromEntries(
    readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => !entry.isDirectory())
      .map((entry) => [join(entry.parentPath, entry.name), readFileSync(join(entry.parentPath, entry.name))]),
  );
}

function hashOf(text: string): string {
  return `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;
}

function allowing(directive: string, texts: string[]): string {
  return [directive, "'self'", ...texts.map(hashOf).sort()].join(" ");
}

function directiveOf(policy: string, directive: string): string | undefined {
  return policy.split("; ").find((entry) => entry.startsWith(`${directive} `));
}

describe("the policy the build computes", () => {
  it("allows each distinct inline script by the hash of its exact text, and a script carrying src by nothing (1)", () => {
    const root = siteOf(VALID);
    writeSecurityHeaders(root);
    const policy = readSecurityHeaders(root)["Content-Security-Policy"];

    expect(directiveOf(policy, "script-src")).toBe(allowing("script-src", [HYDRATION, ROUTER, QUOTING]));
  });

  it("allows each distinct style element by the hash of its text, and nothing inline in general (2)", () => {
    const root = siteOf(VALID);
    writeSecurityHeaders(root);
    const policy = readSecurityHeaders(root)["Content-Security-Policy"];

    expect(directiveOf(policy, "style-src")).toBe(allowing("style-src", [PATHS, SHEET]));
    expect(policy).not.toContain("'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-hashes'");
  });

  it("writes exactly the five headers, beside the served folder and never inside it (3)", () => {
    const root = siteOf(VALID);
    const served = readdirSync(root, { recursive: true }).sort();
    const { list } = writeSecurityHeaders(root);
    const policy = [
      "default-src 'self'",
      allowing("script-src", [HYDRATION, ROUTER, QUOTING]),
      allowing("style-src", [PATHS, SHEET]),
      "img-src 'self'",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join("; ");

    expect(readSecurityHeaders(root)).toEqual({
      "Content-Security-Policy": policy,
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    });
    expect(dirname(list)).toBe(dirname(root));
    expect(readdirSync(root, { recursive: true }).sort()).toEqual(served);
  });

  it("puts both policy tags right after each page's charset, and changes nothing else in it (4)", () => {
    const root = siteOf(VALID);
    writeSecurityHeaders(root);
    const header: string = readSecurityHeaders(root)["Content-Security-Policy"];
    const policy = header
      .split("; ")
      .filter((directive) => !directive.startsWith("frame-ancestors "))
      .join("; ");
    const tags =
      `<meta http-equiv="Content-Security-Policy" content="${policy}">` +
      '<meta name="referrer" content="strict-origin-when-cross-origin">';

    for (const [path, text] of Object.entries(VALID).filter(([name]) => name.endsWith(".html"))) {
      expect(readFileSync(join(root, path), "utf8"), path).toBe(text.replace(CHARSET, `${CHARSET}${tags}`));
    }
  });
});

describe("the refusals of the build", () => {
  it.each(STYLED)("refuses %s, naming the page and writing no list (5)", (_, body) => {
    const root = siteOf({ ...VALID, [REFUSED]: page("", body) });

    expect(() => writeSecurityHeaders(root)).toThrow(join(root, REFUSED));
    expect(besideRoot(root)).toEqual(["public"]);
  });

  it("refuses a folder holding no page, and writes no list (6)", () => {
    const root = siteOf({ "_build/entry.js": "export {};", "favicon.ico": "" });

    expect(() => writeSecurityHeaders(root)).toThrow(root);
    expect(besideRoot(root)).toEqual(["public"]);
  });

  it.each(UNPLACEABLE)("refuses a page with %s, naming it and writing no list (7)", (_, html) => {
    const root = siteOf({ ...VALID, [REFUSED]: html });

    expect(() => writeSecurityHeaders(root)).toThrow(join(root, REFUSED));
    expect(besideRoot(root)).toEqual(["public"]);
  });

  it.each(UNREADABLE)(
    "refuses a page %s, naming it, rewriting no page and writing no list (regression of 4)",
    (_, siteWith) => {
      const root = siteWith();
      const before = bytesUnder(root);

      expect(() => writeSecurityHeaders(root)).toThrow(join(root, REFUSED));
      expect(bytesUnder(root)).toEqual(before);
      expect(besideRoot(root)).toEqual(["public"]);
    },
  );

  it("exits 0 on a valid folder, and non-zero with no list on every refusal (8)", () => {
    const command = resolve("scripts/security-headers.mjs");
    const exitOf = (root: string) => spawnSync(process.execPath, [command, root], { encoding: "utf8" }).status;
    const valid = siteOf(VALID);
    const refused = [
      siteOf({ ...VALID, [REFUSED]: page("", STYLED[0][1]) }),
      siteOf({ "_build/entry.js": "export {};" }),
      ...UNPLACEABLE.map(([, html]) => siteOf({ ...VALID, [REFUSED]: html })),
      ...UNREADABLE.map(([, siteWith]) => siteWith()),
    ];

    expect(exitOf(valid)).toBe(0);
    expect(Object.keys(readSecurityHeaders(valid))).toHaveLength(5);
    for (const root of refused) {
      expect(exitOf(root), root).not.toBe(0);
      expect(besideRoot(root), root).toEqual(["public"]);
    }
  }, 60_000);
});

describe("the reading of the list, which a server starts on", () => {
  it("refuses a list that is missing, naming where it looked", () => {
    const root = siteOf(VALID);
    const { list } = writeSecurityHeaders(root);
    rmSync(list);

    expect(() => readSecurityHeaders(root)).toThrow(list);
  });

  it("refuses a list cut short, naming it", () => {
    const root = siteOf(VALID);
    const { list } = writeSecurityHeaders(root);
    const text = readFileSync(list, "utf8");
    writeFileSync(list, text.slice(0, Math.floor(text.length / 2)), "utf8");

    expect(() => readSecurityHeaders(root)).toThrow(list);
  });

  it("refuses a list lacking one of the five headers, naming it", () => {
    const root = siteOf(VALID);
    const { list } = writeSecurityHeaders(root);
    writeFileSync(list, readFileSync(list, "utf8").replace("X-Frame-Options", "X-Frame-Option"), "utf8");

    expect(() => readSecurityHeaders(root)).toThrow(list);
  });
});
