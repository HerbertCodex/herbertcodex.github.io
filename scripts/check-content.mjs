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

/*
 * Toute tournure d'attente s'ajoute ICI, jamais à côté. La première version de
 * cette liste ne refusait que « à renseigner » : elle laissait passer quatre
 * des cinq emplacements provisoires de la maquette — « chiffre à fournir »,
 * « organisme et objet à préciser », « à compléter », « à venir ». Une porte
 * qui rassure sans protéger est pire qu'une porte absente, parce qu'on cesse
 * de regarder ce qu'elle est censée surveiller.
 */
const MARKERS = [
  /a renseigner/i,
  /chiffre a fournir/i,
  /a preciser/i,
  /a completer/i,
  /a venir/i,
  /lorem ipsum/i,
  /todo-contenu/i,
];

/*
 * Les accents sont retires AVANT comparaison. « Chiffre a fournir » tape sans
 * accent designait exactement la meme attente et passait la porte : une garde
 * qu'une touche manquante desarme ne garde rien.
 */
const sansAccent = (texte) => texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
/*
 * Tout fichier de `src` et `public`, pas une liste d'extensions. La première
 * version n'en lisait que six : un fichier de contenu depose en YAML aurait
 * ete invisible a la porte, qui serait sortie VERTE exactement la ou le
 * contenu vit. Une garde aveugle a son propre sujet est pire qu'une garde
 * absente. Les binaires sont ignores parce qu'ils n'ont pas de lignes.
 */
const ROOTS = ["src/**/*", "public/**/*"];
const BINAIRE = /\.(png|jpe?g|gif|webp|avif|svg|ico|pdf|woff2?|ttf|otf|eot|mp4|webm|zip)$/i;

const offenders = [];
for (const pattern of ROOTS) {
  for (const file of globSync(pattern, { exclude: (e) => e.name === "node_modules", withFileTypes: true })) {
    if (!file.isFile()) continue;
    const path = `${file.parentPath}/${file.name}`;
    if (BINAIRE.test(path)) continue;
    const text = readFileSync(path, "utf8");
    text.split("\n").forEach((line, index) => {
      const hit = MARKERS.find((marker) => marker.test(sansAccent(line)));
      if (hit != null) offenders.push(`${path}:${index + 1}  ${line.trim().slice(0, 80)}`);
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
