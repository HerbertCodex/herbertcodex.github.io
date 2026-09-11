import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const PACKAGE = "package.json";

/* Le serveur que la porte `smoke` utilise, et qui sert le dossier publié tel quel. */
const STATIQUE = "scripts/serve-static.mjs";

/* Le serveur de rendu que le build produit, et que le déploiement n'exécute jamais. */
const NITRO = ".output/server";

function scriptsOf(): Record<string, string> {
  return JSON.parse(readFileSync(PACKAGE, "utf8")).scripts;
}

/*
 * Le site est déployé en FICHIERS : GitHub Pages sert `.output/public`, et
 * aucun serveur de rendu n'y tourne. « Lancer le site » doit donc lancer ce que
 * l'hébergeur sert, sans quoi on regarde autre chose que ce qu'on publie.
 *
 * Ce n'est pas une préférence, c'est un défaut payé : jusqu'au 2026-09-11,
 * `start` et `preview` lançaient `node .output/server/index.mjs`, et ce serveur
 * TRONQUE ses réponses. Mesuré — la racine s'arrêtait au milieu du `<head>`,
 * 1902 octets sans le moindre `<body>`, ce qui donne une page NOIRE chez un
 * lecteur au thème sombre ; et /fr s'arrêtait en plein milieu de la section
 * contact, sans `</body>`. L'opérateur l'a signalé en lançant le site.
 *
 * Servi par `serve-static.mjs`, le même build répond 2346 octets complets à la
 * racine et 29696 à /fr, fermeture comprise.
 */
describe("lancer le site lance ce que l'hébergeur sert", () => {
  it("fait servir le dossier publié par start et par preview", () => {
    const scripts = scriptsOf();

    for (const nom of ["start", "preview"]) {
      expect(scripts[nom], `le script ${nom}`).toContain(STATIQUE);
    }
  });

  it("ne lance aucun serveur de rendu, que le déploiement n'exécute pas", () => {
    const scripts = scriptsOf();
    const fautifs = Object.entries(scripts)
      .filter(([, commande]) => commande.includes(NITRO))
      .map(([nom]) => nom);

    expect(fautifs).toEqual([]);
  });
});
