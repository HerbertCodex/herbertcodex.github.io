import { createContext, useContext, type Accessor } from "solid-js";
import { flatten, translator, type Translator } from "@solid-primitives/i18n";

/**
 * A language the site publishes, written as it appears in an address.
 */
export type Locale = "fr" | "en";

/**
 * The languages the site publishes, in the order the interface offers them.
 */
export const LOCALES: readonly Locale[] = ["fr", "en"];

/**
 * The language an address carrying no prefix leads to.
 */
export const DEFAULT_LOCALE: Locale = "fr";

const DICTIONARIES = {
  fr: {
    nav: { home: "Accueil", about: "À propos" },
    home: { title: "Accueil", heading: "Ingénieur logiciel" },
    about: { title: "À propos", heading: "À propos" },
  },
  en: {
    nav: { home: "Home", about: "About" },
    home: { title: "Home", heading: "Software engineer" },
    about: { title: "About", heading: "About" },
  },
} as const;

type Dictionary = ReturnType<typeof flatten<(typeof DICTIONARIES)["fr"]>>;

/**
 * The language in force, and the translator bound to it.
 */
export type I18n = {
  locale: Accessor<Locale>;
  t: Translator<Dictionary>;
};

/**
 * The context carrying the language in force down to every component.
 */
export const I18nContext = createContext<I18n>();

/**
 * Answers whether a segment read from an address names a published language.
 *
 * @param value - the segment to examine
 * @returns true when the segment names one of the published languages
 */
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Binds a translator to a language that may change while the page stays open.
 *
 * @param locale - the language in force, read on every translation
 * @returns the language and a translator that follows it
 */
export function createI18n(locale: Accessor<Locale>): I18n {
  const dictionary = () => flatten(DICTIONARIES[locale()]) as Dictionary;
  return { locale, t: translator(dictionary) };
}

/**
 * Reads the language in force from the nearest provider.
 *
 * @returns the language and the translator bound to it
 */
export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (value === undefined) {
    throw new Error("useI18n was called outside the locale provider: no language is in force.");
  }
  return value;
}
