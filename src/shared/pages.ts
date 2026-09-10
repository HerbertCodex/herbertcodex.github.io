import type { Locale } from "./i18n";

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
 *
 * The names below were four ADDRESSES until 2026-09-10 and are now three ANCHORS
 * on one page per language. The approved mockup draws a single document that
 * opens on the work and scrolls through it, while its own menu pointed at four
 * addresses; the site had followed the menu. The operator settled it for the
 * document, and the menu of the mockup was corrected with it.
 */
export const HOME: Page = { key: "home", slugs: { fr: "", en: "" } };

/**
 * The parts of the site, the opening first, in the order the page carries them.
 */
export const PAGES: readonly Page[] = [
  HOME,
  { key: "works", slugs: { fr: "realisations", en: "work" } },
  { key: "journey", slugs: { fr: "parcours", en: "about" } },
  { key: "contact", slugs: { fr: "contact", en: "contact" } },
];

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
