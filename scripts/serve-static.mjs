#!/usr/bin/env node
/**
 * Serves the prerendered build the way the deployment target will.
 *
 * The smoke gate and the browser suite both need the built site rather than
 * the dev server: what the dev server proves is that Vite can compile, and
 * that is `build`'s job already. This is one server used by both, because
 * two servers drift and the drift is only found when one suite passes and
 * the other does not.
 *
 * Every answer carries the headers the build computed for the site it
 * serves, read from the list the build wrote beside it. The server knows no
 * value of its own and has no way to serve without them: a build that could
 * not compute its policy writes no list, and without a list nothing is
 * served. No HSTS: this server speaks HTTP on the loopback address, where a
 * forced upgrade would break every resource.
 *
 * Usage: node scripts/serve-static.mjs [port] [root]
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { readSecurityHeaders } from "./security-headers.mjs";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

/**
 * Resolves a request path to a file inside the served root.
 *
 * Traversal is refused rather than clamped: a request that climbs out of the
 * root is not a path to repair, it is a request to answer with 404.
 *
 * @param root - the directory being served
 * @param url - the request URL
 * @returns the absolute file path, or null when it escapes the root
 */
async function resolveFile(root, url) {
  const requested = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const candidate = normalize(join(root, requested));
  if (!candidate.startsWith(normalize(root))) return null;
  for (const path of [candidate, join(candidate, "index.html"), `${candidate}.html`]) {
    try {
      if ((await stat(path)).isFile()) return path;
    } catch {
      continue;
    }
  }
  return null;
}

function securityHeadersOf(root) {
  try {
    return readSecurityHeaders(root);
  } catch (error) {
    throw new Error(`${error.message}. Nothing is served without it: run \`pnpm run build\`.`, { cause: error });
  }
}

/**
 * Starts the static server and resolves once it is accepting connections.
 *
 * The list of headers is read before anything listens, so a refusal leaves
 * the port free.
 *
 * @param root - the directory to serve
 * @param port - the port to bind on the loopback interface
 * @returns the running server
 * @throws naming the list's path, when the list beside the root is missing,
 *   unreadable, or does not carry the five headers each with a value
 */
export async function startServer(root, port) {
  const security = securityHeadersOf(root);
  const head = (response, status, type) => response.writeHead(status, { ...security, "content-type": type });
  const server = createServer(async (request, response) => {
    const path = await resolveFile(root, request.url ?? "/");
    if (path == null) {
      head(response, 404, "text/plain; charset=utf-8");
      response.end("not found");
      return;
    }
    head(response, 200, TYPES[extname(path)] ?? "application/octet-stream");
    response.end(await readFile(path));
  });
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  return server;
}

if (process.argv[1]?.endsWith("serve-static.mjs")) {
  const port = Number(process.argv[2] ?? 4173);
  const root = process.argv[3] ?? ".output/public";
  try {
    await startServer(root, port);
  } catch (error) {
    console.error(`serve-static: ${error.message}`);
    process.exit(1);
  }
  console.log(`serving ${root} on http://127.0.0.1:${port}`);
}
