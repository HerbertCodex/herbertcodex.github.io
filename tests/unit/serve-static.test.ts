// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { get, type IncomingMessage, type Server } from "node:http";
import { createServer as createProbe, type AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { startServer } from "../../scripts/serve-static.mjs";

/**
 * Values no build would ever write: finding them on a response proves the
 * server took them from the list, and wrote none of its own.
 */
const SENTINELS: Record<string, string> = {
  "Content-Security-Policy": "sentinelle-politique 41c7 'aucune'",
  "X-Frame-Options": "sentinelle-cadre 9e02",
  "X-Content-Type-Options": "sentinelle-type 5d18",
  "Referrer-Policy": "sentinelle-referent b3a6",
  "Permissions-Policy": "sentinelle-permissions=() 07f4",
};

const ANSWERS: [string, number][] = [
  ["/", 200],
  ["/_build/entry.js", 200],
  ["/_build/site.css", 200],
  ["/nulle-part", 404],
];

const INCOMPLETE: [string, string | null][] = [
  ["that is absent", null],
  ["that is unreadable", '{"Content-Security-Policy": "default-src'],
  [
    "lacking one of the five headers",
    JSON.stringify(Object.fromEntries(Object.entries(SENTINELS).filter(([name]) => name !== "X-Frame-Options"))),
  ],
  ["carrying an empty value", JSON.stringify({ ...SENTINELS, "Referrer-Policy": "" })],
];

const folders: string[] = [];

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((closed) => server.close(closed))));
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

function servedFolder(list: string | null): { root: string; list: string } {
  const parent = mkdtempSync(join(tmpdir(), "serve-static-"));
  folders.push(parent);
  const root = join(parent, "public");
  mkdirSync(join(root, "_build"), { recursive: true });
  writeFileSync(join(root, "index.html"), '<!DOCTYPE html><html><head><meta charset="utf-8"></head><h1>x</h1></html>');
  writeFileSync(join(root, "_build", "entry.js"), "export {};");
  writeFileSync(join(root, "_build", "site.css"), "h1{color:currentColor}");
  const path = join(parent, "security-headers.json");
  if (list !== null) writeFileSync(path, list, "utf8");
  return { root, list: path };
}

async function started(root: string, port: number): Promise<Server> {
  const server = await startServer(root, port);
  servers.push(server);
  return server;
}

async function freePort(): Promise<number> {
  const probe = createProbe().listen(0, "127.0.0.1");
  await once(probe, "listening");
  const { port } = probe.address() as AddressInfo;
  await new Promise((closed) => probe.close(closed));
  return port;
}

/**
 * Probed by binding the port rather than by connecting to it: under WSL a
 * loopback port closed a moment ago still accepts a connection for about a
 * second, and a probe that connects reports a listener nobody started. A
 * port that cannot be bound, for whatever reason, counts as taken.
 */
function listening(port: number): Promise<boolean> {
  return new Promise((answered) => {
    const probe = createProbe();
    probe.once("error", () => answered(true));
    probe.listen(port, "127.0.0.1", () => probe.close(() => answered(false)));
  });
}

function answerTo(port: number, path: string): Promise<IncomingMessage> {
  return new Promise((answered, failed) => {
    get({ host: "127.0.0.1", port, path }, (response) => {
      response.resume();
      answered(response);
    }).on("error", failed);
  });
}

/**
 * Read from the raw headers rather than from the parsed ones, where a header
 * sent twice arrives joined into one value and could no longer be counted.
 */
function valuesOf(response: IncomingMessage, name: string): string[] {
  const values: string[] = [];
  for (let at = 0; at < response.rawHeaders.length; at += 2) {
    if (response.rawHeaders[at].toLowerCase() === name.toLowerCase()) values.push(response.rawHeaders[at + 1]);
  }
  return values;
}

describe("the headers the server puts on every answer", () => {
  it("puts each of the five once, with the list's value, on a page, a script, a sheet and a 404 (1)", async () => {
    const { root } = servedFolder(JSON.stringify(SENTINELS));
    const { port } = (await started(root, 0)).address() as AddressInfo;
    const each = Object.fromEntries(Object.entries(SENTINELS).map(([name, value]) => [name, [value]]));
    const seen = [];

    for (const [path] of ANSWERS) {
      const response = await answerTo(port, path);
      const headers = Object.fromEntries(Object.keys(SENTINELS).map((name) => [name, valuesOf(response, name)]));
      seen.push({ path, status: response.statusCode, headers });
    }

    expect(seen).toEqual(ANSWERS.map(([path, status]) => ({ path, status, headers: each })));
  });
});

describe("the server refuses to start without a complete list", () => {
  it.each(INCOMPLETE)("refuses a list %s, naming its path, with nothing listening (2)", async (_, text) => {
    const { root, list } = servedFolder(text);
    const port = await freePort();

    await expect(started(root, port)).rejects.toThrow(list);
    expect(await listening(port)).toBe(false);
  });

  it("exits non-zero from the command line, naming the list, with nothing listening (2)", async () => {
    const { root, list } = servedFolder(null);
    const port = await freePort();
    const run = spawnSync(process.execPath, [resolve("scripts/serve-static.mjs"), String(port), root], {
      encoding: "utf8",
      timeout: 10_000,
    });

    expect({ killed: run.signal, failed: run.status !== 0, named: run.stderr.includes(list) }).toEqual({
      killed: null,
      failed: true,
      named: true,
    });
    expect(await listening(port)).toBe(false);
  }, 30_000);
});
