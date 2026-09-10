import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const REGISTRE = "docs/security/owasp-top10-2025.json";

type Category = {
  readonly status: string;
  readonly controls: readonly { readonly gate: string; readonly description: string }[];
  readonly limitations: readonly string[];
};

const HEADERS = [
  "Content-Security-Policy",
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
];

/* Les deux balises que le build écrit, nommées par l'attribut qui les distingue de toute autre balise meta. */
const TAGS = ['http-equiv="Content-Security-Policy"', 'name="referrer"'];

/*
 * Ce qu'aucune balise ne peut porter, donc ce que Pages ne délivre pas : le
 * refus de mise en cadre sous ses deux noms, nosniff et la Permissions-Policy.
 */
const UNDELIVERED = ["frame-ancestors", "X-Frame-Options", "nosniff", "Permissions-Policy"];

function misconfiguration(): Category {
  return JSON.parse(readFileSync(REGISTRE, "utf8")).categories.A02;
}

/* Les limites qui portent ensemble tous les mots demandés : éparpillés, ils ne disent plus rien. */
function saying(limitations: readonly string[], words: readonly string[]): string[] {
  return limitations.filter((limitation) =>
    words.every((word) => limitation.toLowerCase().includes(word.toLowerCase())),
  );
}

describe("la catégorie A02 du registre OWASP", () => {
  it("est partielle : ni non vérifiée, ni vérifiée sur la foi d'un scan", () => {
    expect(misconfiguration().status).toBe("partial");
  });

  it("nomme dans ses contrôles les cinq en-têtes et les deux balises", () => {
    const said = misconfiguration()
      .controls.map((control) => control.description)
      .join("\n");

    expect([...HEADERS, ...TAGS].filter((name) => !said.includes(name))).toEqual([]);
  });

  it("nomme dans ses limites ce que GitHub Pages ne délivre pas, et que seul le serveur de la CI est mesuré", () => {
    const { limitations } = misconfiguration();

    expect(UNDELIVERED.filter((name) => saying(limitations, ["GitHub Pages", "délivr", name]).length === 0)).toEqual(
      [],
    );
    expect(saying(limitations, ["seul", "serveur de la CI", "mesur"]).length).toBeGreaterThan(0);
  });
});
