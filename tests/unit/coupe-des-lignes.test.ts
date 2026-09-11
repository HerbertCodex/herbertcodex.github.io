import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DICTIONARIES, LOCALES } from "~/shared/i18n";
import { contentFor } from "~/shared/content";

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

/*
 * Le tiret cadratin est ecarte des textes du site. L'operateur l'a demande le
 * 2026-09-11, et c'est une regle de MAISON plutot qu'une regle de typographie :
 * la ponctuation francaise ordinaire — deux-points, virgule, point — dit la
 * meme chose sans ce trait qui fait « ecrit par une machine ».
 *
 * La regle porte sur ce que le VISITEUR lit : les dictionnaires et le contenu
 * editorial. Les commentaires du code n'en sont pas, et en gardent.
 */
describe("les textes du site n'emploient pas le tiret cadratin", () => {
  it("ni dans les dictionnaires, dans aucune des deux langues", () => {
    const portant: string[] = [];

    for (const locale of LOCALES) {
      const dit = JSON.stringify(DICTIONARIES[locale]);
      if (dit.includes("—")) portant.push(locale);
    }

    expect(portant).toEqual([]);
  });

  it("ni dans le contenu editorial, dans aucune des deux langues", () => {
    const portant: string[] = [];

    for (const locale of LOCALES) {
      const dit = JSON.stringify(contentFor(locale));
      if (dit.includes("—")) portant.push(locale);
    }

    expect(portant).toEqual([]);
  });
});

/*
 * Le chapo est justifie, mais pas partout : une colonne de vingt-huit signes
 * justifiee ecarte les mots jusqu'a trouer le texte, mesure a 375 px. La
 * declaration doit donc vivre SOUS une condition de largeur, et c'est cela que
 * ce test verifie — pas la largeur des blancs, qu'une station sans les polices
 * du site ne peut pas juger.
 */
describe("le chapo n'est justifie que sur une colonne qui le porte", () => {
  it("ne justifie rien sans condition de largeur", () => {
    const feuille = readFileSync(OUVERTURE, "utf8");
    const regleSeule = declaredBy(feuille, ".lede");

    expect(regleSeule).not.toContain("text-align: justify");
    expect(feuille).toContain("text-align: justify");
  });

  it("place la justification sous la bascule des 768 px", () => {
    const feuille = readFileSync(OUVERTURE, "utf8");
    const apresBascule = feuille.slice(feuille.lastIndexOf("@media (min-width: 768px)"));

    expect(apresBascule).toContain("text-align: justify");
  });

  it("ne coupe aucun mot pour y parvenir", () => {
    expect(readFileSync(OUVERTURE, "utf8")).not.toContain("hyphens: auto");
  });
});
