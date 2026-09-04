#!/usr/bin/env node
/**
 * Removes the previous build before a new one starts.
 *
 * Without this the build check reads a stale artefact: a route that failed
 * to compile keeps the `index.html` the last successful build wrote, and the
 * gate confirms a page the current source can no longer produce. Observed
 * here on 2026-09-04, and it is the reason this file exists rather than a
 * shell `rm -rf` in the package script.
 *
 * Usage: node scripts/clean-output.mjs
 */
import { rmSync } from "node:fs";

rmSync(".output", { recursive: true, force: true });
