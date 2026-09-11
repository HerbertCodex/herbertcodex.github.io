import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DICTIONARIES, LOCALES } from "~/shared/i18n";

const OUVERTURE = "src/features/home/Opening.css";

const PARTAGE = "src/app.css";

/* L'espace insécable, celle que la typographie française met avant un deux-points. */
const INSECABLE = " ";

/*
 * La règle d'un sélecteur pris EN DÉBUT DE LIGNE, jamais n'importe où : une
 * recherche par sous-chaîne trouvait d'abord `.lede` indenté dans une requête
 * de média, et lisait donc la mauvaise règle. Mesuré en écrivant ce test.
 */
function declaredBy(sheet: string, selector: string): string {
  const found = new RegExp(`^${selector.replace(".", "\\.")} \\{([^}]*)\\}`, "m").exec(sheet);
  return found?.[1] ?? "";
}

/*
 * Une ligne qui se coupe mal se voit, et l'opérateur l'a vue : « cadre. » seul
 * sous trois lignes pleines, et le deux-points renvoyé au début de la ligne
 * suivante.
 *
 * Ces assertions portent sur les DÉCLARATIONS, jamais sur des positions
 * mesurées. La station de mesure ne résout aucune des quatre faces de
 * `--font-grotesk` et sert le site en DejaVu Sans : les coupures qu'on y
 * observerait ne sont pas celles que le visiteur voit, et la décision 0016 l'a
 * déjà payé une fois. Ce qui est vérifiable ici, c'est que le mécanisme est
 * demandé.
 */
describe("le texte se coupe comme un typographe le couperait", () => {
  it("demande au navigateur d'éviter le mot seul en dernière ligne du chapô", () => {
    expect(declaredBy(readFileSync(OUVERTURE, "utf8"), ".lede")).toContain("text-wrap: pretty");
  });

  it("équilibre les lignes des titres, qui sont courts", () => {
    const partage = readFileSync(PARTAGE, "utf8");

    for (const titre of ["h1", "h2"]) {
      expect(declaredBy(partage, titre), titre).toContain("text-wrap: balance");
    }
  });

  it("garde le deux-points avec le mot qui le précède, dans les deux langues", () => {
    for (const locale of LOCALES) {
      const lede = DICTIONARIES[locale].home.lede;
      const avant = lede.indexOf(" :");

      /* L'anglais n'en met pas : la règle est française, et l'assertion doit le dire. */
      if (locale === "en") expect(lede, locale).not.toContain(` :`);
      else expect(avant, `${locale} : une espace ordinaire avant le deux-points`).toBe(-1);
      if (locale === "fr") expect(lede).toContain(`${INSECABLE}:`);
    }
  });
});
