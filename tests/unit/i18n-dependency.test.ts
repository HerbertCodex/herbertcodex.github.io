import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("the internationalisation dependency", () => {
  it("is declared at the exact version decision 0005 authorises", () => {
    const manifest = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies: Record<string, string>;
    };
    expect(manifest.dependencies["@solid-primitives/i18n"]).toBe("2.2.1");
  });
});
