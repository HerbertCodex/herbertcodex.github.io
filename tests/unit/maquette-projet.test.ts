import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MOCKUP = "mockups/portfolio-v1.html";

/*
 * Les quatre valeurs de cadre que la maquette déclarait déjà, et que cette
 * issue ne touche pas. Elles sont énumérées ici pour que le test refuse aussi
 * la correction qui déplacerait le pied en déplaçant tout le reste : une
 * maquette dont la seule valeur ajoutée arrive au prix de trois autres n'est
 * plus la référence contre laquelle les écrans sont codés.
 */
const UNCHANGED: readonly (readonly [string, string])[] = [
  ["footer", "margin-top: var(--space-5);"],
  ["footer", "padding-top: var(--space-3);"],
  [".bar", "margin-bottom: var(--space-5);"],
  ["h1", "margin: 0 0 var(--space-3);"],
];

/*
 * Le bloc d'une règle, lu par sa ligne d'ouverture exacte plutôt que par une
 * expression sur tout le fichier : `footer` apparaît aussi bien comme sélecteur
 * que dans le balisage, et `h1` est porté par quatre règles descendantes.
 */
function ruleFor(sheet: string, selector: string): string {
  const lines = sheet.split("\n");
  const opening = lines.findIndex((line) => line.trim() === `${selector} {`);
  if (opening === -1) return "";
  const closing = lines.findIndex((line, rank) => rank > opening && line.trim() === "}");
  return lines.slice(opening + 1, closing === -1 ? undefined : closing).join("\n");
}

describe("la maquette déclarée du projet", () => {
  it("dit l'espace sous la dernière ligne de son pied, et ne bouge aucune des quatre valeurs de cadre", () => {
    const drawn = readFileSync(MOCKUP, "utf8");

    expect(ruleFor(drawn, "footer"), "le pied de la maquette").toContain("padding-bottom: var(--space-4);");
    for (const [selector, declaration] of UNCHANGED) {
      expect(ruleFor(drawn, selector), `${selector} { ${declaration} }`).toContain(declaration);
    }
  });
});
