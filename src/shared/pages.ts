import type { Locale, Said } from "./i18n";

/**
 * A part of the site, named by what it is rather than by where it lives.
 */
export type PageKey = "home" | "works" | "journey" | "contact";

/**
 * A part the single page carries as a section, which home is never one of.
 */
type NamedPageKey = Exclude<PageKey, "home">;

/**
 * One part of the site, and the name it carries in each published language.
 */
export type Page = {
  readonly key: PageKey;
  readonly slugs: Readonly<Record<Locale, string>>;
};

/**
 * A part whose name is written in every language, therefore addressable.
 */
export type NamedPage = Page & { readonly key: NamedPageKey };

/**
 * The opening of the page, which carries no name and therefore no anchor.
 */
export const HOME: Page = { key: "home", slugs: { fr: "", en: "" } };

const WORKS: Page = { key: "works", slugs: { fr: "realisations", en: "work" } };

const JOURNEY: Page = { key: "journey", slugs: { fr: "parcours", en: "about" } };

const CONTACT: Page = { key: "contact", slugs: { fr: "contact", en: "contact" } };

/**
 * The parts that carried an ADDRESS of their own until 2026-09-10.
 *
 * This table is what keeps those addresses answering: each named part is
 * published as a document that redirects to its anchor, because a link already
 * shared cannot be recalled. It is NOT what the menu reads — the menu names the
 * sections the page shows, which `SECTIONS` below declares.
 *
 * `journey` is the one that no longer matches a section: what was one page is
 * now three, so its anchor names the GROUP of the three, and `/fr/parcours`
 * still leads there.
 */
export const PAGES: readonly Page[] = [HOME, WORKS, JOURNEY, CONTACT];

function isNamed(page: Page): page is NamedPage {
  return page.key !== "home" && Object.values(page.slugs).every((slug) => slug.length > 0);
}

/**
 * The languages the table names, read from it rather than declared twice.
 *
 * @param pages - the table to read
 * @returns the languages every page of the table is named in
 */
function localesOf(pages: readonly Page[]): Locale[] {
  return Object.keys(pages[0]?.slugs ?? {}) as Locale[];
}

/**
 * The sections the single page carries, in the order the table declares them.
 */
export const NAMED_PAGES: readonly NamedPage[] = PAGES.filter(isNamed);

/**
 * The name a section answers to inside a page, in one language.
 *
 * @param page - the section to name
 * @param locale - the language the name is written in
 * @returns the anchor, empty for the opening since a page needs no anchor
 */
export function anchorOf(page: Page, locale: Locale): string {
  return page.slugs[locale];
}

/**
 * The address that leads a visitor to a part of the site, in one language.
 *
 * @param page - the part to reach
 * @param locale - the language the address is written in
 * @returns the page's own address, carrying the anchor when it is a section
 */
export function addressOf(page: Page, locale: Locale): string {
  const anchor = anchorOf(page, locale);
  return anchor.length === 0 ? `/${locale}` : `/${locale}#${anchor}`;
}

/**
 * The pages a visitor reads: one per language, each carrying every section.
 *
 * @param pages - the table to read
 * @returns one address per published language
 */
export function publishedAddresses(pages: readonly Page[]): string[] {
  return localesOf(pages).map((locale) => `/${locale}`);
}

/**
 * The addresses that were pages until 2026-09-10 and now lead to an anchor.
 *
 * They are still answered, and that is a decision rather than an oversight: a
 * CV and a LinkedIn profile carry `/fr/realisations` into the world, and a
 * link already shared cannot be recalled. Each one is published as a document
 * that sends the visitor to the anchor, with a visible way through for
 * whoever refuses the automatic one.
 *
 * @param pages - the table to read
 * @returns one address per section and per language that section is named in
 */
export function redirectedAddresses(pages: readonly Page[]): string[] {
  return pages
    .filter(isNamed)
    .flatMap((page) => localesOf(pages).map((locale) => `/${locale}/${anchorOf(page, locale)}`));
}

/**
 * Every document a build must write for a table of parts.
 *
 * @param pages - the table to read
 * @returns the pages a visitor reads, then the addresses that redirect to them
 */
export function addressesToPrerender(pages: readonly Page[]): string[] {
  return [...publishedAddresses(pages), ...redirectedAddresses(pages)];
}

/**
 * The section a name designates in one language, for the redirect route alone.
 *
 * @param locale - the language the name is written in
 * @param slug - the name read from the address
 * @returns the section, or undefined when that language names none so
 */
export function pageForSlug(locale: Locale, slug: string): NamedPage | undefined {
  if (slug.length === 0) return undefined;
  return NAMED_PAGES.find((page) => page.slugs[locale] === slug);
}

/**
 * A section of the page, as the menu names it and as the reader sees it.
 */
export type Section = {
  readonly key: string;
  readonly slugs: Readonly<Record<Locale, string>>;
  readonly label: Said;
};

/**
 * The sections the page carries, in the order it carries them.
 *
 * The menu named three parts until 2026-09-10 — Réalisations, Parcours,
 * Contact — while the page showed FIVE numbered sections, and « Parcours »
 * matched no visible heading: it was the name of an address, kept after the
 * address was gone. The operator read the page and said what was missing.
 *
 * The two that carried an address of their own take their name from the table
 * above rather than writing it again: `works` and `contact` would otherwise be
 * two strings able to disagree. The three others belong to the journey, and
 * their labels are the ones their own heading shows — the same dictionary
 * entry, so the menu and the section can never say it differently.
 *
 * Certifications are deliberately absent: that section exists only when there
 * is one to show, and a menu entry leading to nothing would be worse than an
 * unnamed section. It stays part of the journey, between Formation and
 * Compétences.
 */
export const SECTIONS: readonly Section[] = [
  { key: "works", slugs: WORKS.slugs, label: "nav.works" },
  { key: "experience", slugs: { fr: "experience", en: "experience" }, label: "journey.sections.experience" },
  { key: "education", slugs: { fr: "formation", en: "education" }, label: "journey.sections.education" },
  { key: "skills", slugs: { fr: "competences", en: "skills" }, label: "journey.sections.skills" },
  { key: "contact", slugs: CONTACT.slugs, label: "nav.contact" },
];

/**
 * The address that leads to a section of the page, in one language.
 *
 * @param section - the section to reach
 * @param locale - the language the address is written in
 * @returns the page's address, carrying the section's anchor
 */
export function addressOfSection(section: Section, locale: Locale): string {
  return `/${locale}#${section.slugs[locale]}`;
}
