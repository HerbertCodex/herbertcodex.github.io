import { For } from "solid-js";
import { LOCALES, useI18n, type Locale } from "~/shared/i18n";
import { resumeOf, type Resume } from "~/shared/resume";

/**
 * A way of reaching the person, and its target.
 */
export type ContactMeans = {
  readonly key: "linkedin" | "github" | "cv";
  readonly href: string;
};

/**
 * The primary call of the contact card, and the profile it leads to.
 */
export const CONTACT_CALL: ContactMeans = { key: "linkedin", href: "https://linkedin.com/in/donatien-koffi" };

const PROFILES: readonly ContactMeans[] = [{ key: "github", href: "https://github.com/HerbertCodex" }];

const ABSOLUTE = /^https:\/\/[^\s/]+\.[^\s/]+\/\S+$/;
const DOCUMENT = /^\/[^\s?#]+\.pdf$/;

/*
 * Le CV vient de `resume.ts`, qui le porte deja pour la page du parcours. Une
 * seconde declaration ici aurait rappelle le CV au contact alors que le
 * parcours ne le propose plus, ou l'inverse, et la page fautive serait celle
 * que personne ne regarde ce jour-la. Le rang, lui, appartient a ce module :
 * le CV rejoint le second rang, jamais l'appel principal.
 */
/**
 * The means of contact at the second rank, in the order the design fixes.
 *
 * @param locale - the language in force, which decides which résumé applies
 * @param resume - the résumé that language publishes, absent when none does
 * @returns GitHub, then the résumé when that language has one
 */
export function contactMeans(locale: Locale, resume: Resume | undefined = resumeOf(locale)): readonly ContactMeans[] {
  if (resume === undefined) return PROFILES;
  return [...PROFILES, { key: "cv", href: resume.href }];
}

/**
 * The contact targets stated empty or malformed, which are never published.
 *
 * @param means - the means to inspect, the primary call included
 * @returns one key per faulty target, an empty list when every target holds
 */
export function malformedContactLinks(means: readonly ContactMeans[]): string[] {
  const faults: string[] = [];
  for (const mean of means) {
    const shape = mean.key === "cv" ? DOCUMENT : ABSOLUTE;
    if (!shape.test(mean.href.trim())) faults.push(mean.key);
  }
  return faults;
}

/*
 * Le refus est prononce au chargement du module, pas a l'affichage : attendre
 * le rendu reviendrait a publier le lien mort et a le decouvrir sur le site.
 * La page de contact importe ce module et le prerendu l'evalue, donc
 * `pnpm run build` sort non nul — mesure le 2026-09-06 en remplacant l'adresse
 * de LinkedIn par une chaine vide, puis rejoue apres restauration.
 */
const FAULTS = [
  ...new Set(LOCALES.flatMap((locale) => malformedContactLinks([CONTACT_CALL, ...contactMeans(locale)]))),
];
if (FAULTS.length > 0) {
  throw new Error(`un lien de contact est vide ou mal formé : ${FAULTS.join(", ")}`);
}

/**
 * The second rank of the contact block: the profiles, then the résumé.
 *
 * They are list ITEMS and no longer a list of their own: the plate draws one
 * row of links, the primary call first, and two lists side by side would have
 * been two rows that a reader reads as two ranks.
 *
 * @returns the secondary contact links, in the language in force
 */
export default function ContactLinks() {
  const { locale, t } = useI18n();
  return (
    <For each={contactMeans(locale())}>
      {(mean) => (
        <li>
          <a href={mean.href}>{t(`contact.links.${mean.key}`)}</a>
        </li>
      )}
    </For>
  );
}
