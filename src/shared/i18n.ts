import { createContext, useContext, type Accessor } from "solid-js";
import { flatten, resolveTemplate, translator, type Translator } from "@solid-primitives/i18n";

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
    bar: { skip: "Aller au contenu", nav: "Navigation principale", theme: "Sombre" },
    nav: { works: "Réalisations", journey: "Parcours", contact: "Contact" },
    footer: { label: "Pied de page", place: "Rennes, France" },
    moved: { call: "Continuer vers la page" },
    home: {
      heading: "Ingénieur logiciel",
      lede:
        "Je livre du logiciel métier sur des systèmes répartis, et j'écris le cadre qui rend ce travail " +
        "vérifiable : exigences écrites, rôles séparés, portes exécutables. Avec ou sans IA. Cette page en " +
        "est la démonstration, puisqu'elle est construite par ce cadre.",
      facts: {
        contract: "CDI ou freelance",
        place: "Rennes, mobile en France",
        education: "Master MIAGE · DLIS",
        languages: "FR · EN",
      },
      entries: {
        works: "Ce que j'ai construit, ce que ça fait, et comment.",
        journey: "Où j'ai travaillé, ce que j'ai étudié, ce que je sais faire.",
        contact: "Ce que je cherche, et par où me joindre.",
      },
    },
    works: {
      heading: "Réalisations",
      personal: "Projet personnel",
      openSource: "Projet personnel, open source",
      inHouse: "En entreprise, {{ employer }}",
      problem: "Le problème",
      did: "Ce que j'ai fait",
      result: "Le résultat",
      code: "Voir le code",
      demo: "Voir le site",
    },
    journey: {
      heading: "Parcours",
      sections: {
        experience: "Expérience",
        education: "Formation",
        certifications: "Certifications",
        skills: "Compétences",
      },
      present: "aujourd'hui",
      current: "En poste",
      ongoing: "En cours d'obtention",
      resume: "CV en PDF",
    },
    contact: {
      heading: "Contact",
      lede: "Disponible immédiatement",
      call: "Me joindre sur LinkedIn",
      terms: {
        contract: { label: "Contrat", value: "CDI ou mission freelance" },
        place: { label: "Lieu", value: "Rennes, mobile partout en France, ou à distance" },
        start: { label: "Début", value: "Immédiat" },
      },
      links: { linkedin: "LinkedIn", github: "GitHub", cv: "CV en PDF" },
    },
    notFound: {
      title: "Page introuvable",
      heading: "Page introuvable",
      lede: "Cette adresse ne correspond à aucune page de ce site.",
      home: "Retour à l'accueil",
    },
  },
  en: {
    bar: { skip: "Skip to content", nav: "Main navigation", theme: "Dark" },
    nav: { works: "Work", journey: "About", contact: "Contact" },
    footer: { label: "Site footer", place: "Rennes, France" },
    moved: { call: "Continue to the page" },
    home: {
      heading: "Software engineer",
      lede:
        "I ship business software on distributed systems, and I write the framework that makes that work " +
        "verifiable: written requirements, separated roles, executable gates. With or without AI. This page " +
        "is that demonstration, since it is built by that framework.",
      facts: {
        contract: "Permanent or freelance",
        place: "Rennes, mobile across France",
        education: "MIAGE master's · DLIS",
        languages: "FR · EN",
      },
      entries: {
        works: "What I have built, what it does, and how.",
        journey: "Where I have worked, what I studied, what I can do.",
        contact: "What I am looking for, and how to reach me.",
      },
    },
    works: {
      heading: "Work",
      personal: "Personal project",
      openSource: "Personal project, open source",
      inHouse: "In-house, {{ employer }}",
      problem: "The problem",
      did: "What I did",
      result: "The result",
      code: "View the code",
      demo: "View the site",
    },
    journey: {
      heading: "About",
      sections: {
        experience: "Experience",
        education: "Education",
        certifications: "Certifications",
        skills: "Skills",
      },
      present: "present",
      current: "Current role",
      ongoing: "In progress",
      resume: "Résumé (PDF)",
    },
    contact: {
      heading: "Contact",
      lede: "Available immediately",
      call: "Reach me on LinkedIn",
      terms: {
        contract: { label: "Contract", value: "Permanent role or freelance engagement" },
        place: { label: "Location", value: "Rennes, mobile across France, or remote" },
        start: { label: "Availability", value: "Immediate" },
      },
      links: { linkedin: "LinkedIn", github: "GitHub", cv: "Résumé (PDF)" },
    },
    notFound: {
      title: "Page not found",
      heading: "Page not found",
      lede: "This address matches no page on this site.",
      home: "Back to home",
    },
  },
} as const;

type Dictionary = ReturnType<typeof flatten<(typeof DICTIONARIES)["fr"]>>;

/**
 * A key the translator resolves to a SENTENCE, written as the dictionaries
 * nest it. The intermediate keys are excluded on purpose: `bar` names a group,
 * not something a component can display.
 *
 * Exported so a table can DECLARE which sentence it names instead of holding
 * the sentence itself: a label written twice is a label able to disagree with
 * itself, and only the type keeps such a declaration honest.
 */
export type Said = { [K in keyof Dictionary]: Dictionary[K] extends string ? K : never }[keyof Dictionary];

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
  return { locale, t: translator(dictionary, resolveTemplate) };
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
