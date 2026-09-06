import type { Locale } from "./i18n";

/*
 * La liste est ECRITE, pas derivee du dossier, et la mesure du 2026-09-06 dit
 * pourquoi. Un `import.meta.glob("/public/cv/*.pdf")` fonctionne — les cles
 * sont bien les fichiers presents — mais la construction emet alors une
 * SECONDE copie de chaque PDF dans `.output/public/_build/assets/`, a cote de
 * celle que le dossier public sert deja, plus un module JS qui la porte. Un
 * fichier de 300 ko mesure : 300 ko dupliques dans l artefact deploye, pour un
 * chargeur que personne n appelle jamais. La variante `query: "?url"` fait
 * pire : elle inline le PDF en base64 dans la page prerendue.
 *
 * La derive que la derivation aurait interdite est donc refusee ailleurs :
 * `tests/unit/cv.test.ts` confronte cette liste au dossier DANS LES DEUX SENS,
 * et `test_unit` tourne a chaque poussee. Un fichier annonce et absent, ou
 * present et non annonce, fait echouer la porte avant la fusion.
 */
const FOLDER = "cv";

/**
 * Where the résumé of a language is served, and the file that must carry it.
 *
 * The two travel together because one is only true while the other exists: an
 * address published for a file the repository does not carry is a link to a
 * 404, and it is exactly what nothing else can see.
 */
export type Resume = {
  readonly href: string;
  readonly file: string;
};

/**
 * The directory of the repository the published résumés are read from.
 */
export const RESUME_FOLDER = `public/${FOLDER}`;

/*
 * Vide tant que l'operateur n'a fourni aucun document. Un portfolio qui
 * propose un CV qu'il n'a pas coute un clic a son lecteur et son credit a son
 * auteur, et rien d'autre ne verrait la difference.
 *
 * Volontairement NON exporte : personne ne l'importe, et un export garde
 * « pour plus tard » est du code mort avec une excuse — la porte `dead_code`
 * l'a refuse. Ajouter une langue ici est la seule chose a faire pour publier
 * un CV, avec le fichier qui va avec.
 */
const RESUMES: Readonly<Partial<Record<Locale, string>>> = {};

/**
 * The résumé of one language.
 *
 * @param locale - the language in force
 * @param published - the files the repository publishes, one per language
 * @returns where it is served and which file carries it, or undefined when no file does
 */
export function resumeOf(
  locale: Locale,
  published: Readonly<Partial<Record<Locale, string>>> = RESUMES,
): Resume | undefined {
  const name = published[locale];
  if (name === undefined) return undefined;
  return { href: `/${FOLDER}/${name}`, file: `${RESUME_FOLDER}/${name}` };
}
