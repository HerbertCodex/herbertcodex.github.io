import type { Locale } from "./i18n";

/**
 * A page of the site, named by what it is rather than by where it lives.
 */
export type PageKey = "home" | "works" | "journey" | "contact";

/**
 * A page the common route serves, which home is never one of.
 */
export type NamedPageKey = Exclude<PageKey, "home">;

/**
 * One page, and the name it carries in each published language.
 */
export type Page = {
  readonly key: PageKey;
  readonly slugs: Readonly<Record<Locale, string>>;
};

/**
 * A page whose name is written in every language, therefore addressable.
 */
export type NamedPage = Page & { readonly key: NamedPageKey };

/**
 * The pages the site publishes, and the only place their names are written.
 */
export const PAGES: readonly Page[] = [
  { key: "home", slugs: { fr: "", en: "" } },
  { key: "works", slugs: { fr: "realisations", en: "work" } },
  { key: "journey", slugs: { fr: "parcours", en: "about" } },
  { key: "contact", slugs: { fr: "contact", en: "contact" } },
];

function isNamed(page: Page): page is NamedPage {
  return page.key !== "home" && Object.values(page.slugs).every((slug) => slug.length > 0);
}

/**
 * The pages the common route serves, in the order the table declares them.
 */
export const NAMED_PAGES: readonly NamedPage[] = PAGES.filter(isNamed);

/**
 * The address of a page in one language.
 *
 * @param page - the page to address
 * @param locale - the language the address is written in
 * @returns the address, reduced to the language prefix when the page has no name
 */
export function addressOf(page: Page, locale: Locale): string {
  const slug = page.slugs[locale];
  return slug.length === 0 ? `/${locale}` : `/${locale}/${slug}`;
}

/**
 * The addresses a build must produce for a table of pages.
 *
 * @param pages - the table to read
 * @returns one address per page and per language that page is named in
 */
export function addressesToPrerender(pages: readonly Page[]): string[] {
  return pages.flatMap((page) => Object.keys(page.slugs).map((locale) => addressOf(page, locale as Locale)));
}

/**
 * The page a name designates in one language, for the common route alone.
 *
 * @param locale - the language the name is written in
 * @param slug - the name read from the address
 * @returns the page, or undefined when that language names no page so
 */
export function pageForSlug(locale: Locale, slug: string): NamedPage | undefined {
  if (slug.length === 0) return undefined;
  return NAMED_PAGES.find((page) => page.slugs[locale] === slug);
}
