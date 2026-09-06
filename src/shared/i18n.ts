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

/**
 * What the interface says, one tree per published language.
 *
 * Exported so that the completeness check can confront the two trees. The
 * translator only ever holds one of them, so nothing inside this module can
 * see that a key was added to one language and not to the other.
 */
export const DICTIONARIES = {
  fr: {
    bar: { skip: "Aller au contenu", nav: "Navigation principale" },
    nav: { home: "Accueil", works: "Réalisations", journey: "Parcours", contact: "Contact" },
    home: {
      title: "Accueil",
      heading: "Ingénieur logiciel",
      lede:
        "Je mets des assistants entre les mains d'utilisateurs métier, et j'écris le cadre qui rend ce travail " +
        "vérifiable : rôles séparés, portes exécutables, traçabilité. Cette page en est la démonstration, " +
        "puisqu'elle est construite par lui.",
      facts: {
        contract: "CDI ou freelance",
        place: "Rennes, mobile en France",
        education: "Master MIAGE",
        languages: "FR · EN",
      },
      entries: {
        works: "Ce que j'ai construit, ce que ça fait, et comment.",
        journey: "Où j'ai travaillé, ce que j'ai étudié, ce que je sais faire.",
        contact: "Ce que je cherche, et par où me joindre.",
      },
    },
    works: { title: "Réalisations", heading: "Réalisations" },
    journey: { title: "Parcours", heading: "Parcours" },
    contact: { title: "Contact", heading: "Contact" },
  },
  en: {
    bar: { skip: "Skip to content", nav: "Main navigation" },
    nav: { home: "Home", works: "Work", journey: "About", contact: "Contact" },
    home: {
      title: "Home",
      heading: "Software engineer",
      lede:
        "I put assistants in the hands of business users, and I write the framework that makes that work " +
        "verifiable: separated roles, executable gates, traceability. This page is that demonstration, " +
        "since it is built by it.",
      facts: {
        contract: "Permanent or freelance",
        place: "Rennes, mobile across France",
        education: "MIAGE master's degree",
        languages: "FR · EN",
      },
      entries: {
        works: "What I have built, what it does, and how.",
        journey: "Where I have worked, what I studied, what I can do.",
        contact: "What I am looking for, and how to reach me.",
      },
    },
    works: { title: "Work", heading: "Work" },
    journey: { title: "About", heading: "About" },
    contact: { title: "Contact", heading: "Contact" },
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
