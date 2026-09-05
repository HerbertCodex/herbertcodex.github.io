/**
 * Refuses a placeholder that has left the mockups directory.
 *
 * A mockup is allowed to say "A RENSEIGNER": that is what a mockup is for, and
 * the marker is drawn so nobody mistakes it for a fact. The shipped site is not
 * allowed to. Without this gate the two are indistinguishable to any command,
 * and a placeholder written to unblock an afternoon reaches a recruiter.
 *
 * The marker is deliberately ugly and deliberately searchable. A plausible
 * stand-in — "Kubernetes" written while waiting for the real list — would pass
 * every gate this project has, because nothing can tell an invented fact from a
 * true one. Only an unmistakable marker can be refused mechanically.
 */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const MARKERS = [/A RENSEIGNER/i, /à renseigner/i, /LOREM IPSUM/i, /TODO-CONTENU/];
const ROOTS = ["src/**/*.{ts,tsx,css,json,md}", "public/**/*.{html,json,md,txt}"];

const offenders = [];
for (const pattern of ROOTS) {
  for (const file of globSync(pattern, { exclude: (p) => p.includes("node_modules") })) {
    const text = readFileSync(file, "utf8");
    text.split("\n").forEach((line, index) => {
      const hit = MARKERS.find((marker) => marker.test(line));
      if (hit != null) offenders.push(`${file}:${index + 1}  ${line.trim().slice(0, 80)}`);
    });
  }
}

if (offenders.length > 0) {
  console.error(`${offenders.length} placeholder(s) outside mockups/:\n`);
  for (const line of offenders) console.error(`  ${line}`);
  console.error(
    "\nA mockup may carry a placeholder; the site may not. Replace it with the real\n" +
      "content, or remove the section until the content exists. An empty section is\n" +
      "honest; an invented one is not.",
  );
  process.exit(1);
}
console.log("content: no placeholder outside mockups/.");
