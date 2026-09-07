import { flatten } from "@solid-primitives/i18n";
import { contentFor, type Content } from "./content";
import { ENGLISH } from "./content/en";
import { FRENCH } from "./content/fr";
import { EXPERIENCES, SKILL_GROUPS, WORKS, type Words } from "./content/facts";
import { DICTIONARIES, LOCALES, type Locale } from "./i18n";

type Phrases = { readonly [key: string]: string | Phrases };

type SkillsAnnounced = { readonly id: string; readonly skills: readonly string[] };

type ToolsUsed = { readonly tools: readonly string[] };

/**
 * A section of the site whose entries are counted rather than announced.
 */
export type SectionName = "works" | "experiences" | "education" | "certifications" | "skills";

const SECTIONS: readonly SectionName[] = ["works", "experiences", "education", "certifications", "skills"];

function absentPerLocale(present: Readonly<Record<Locale, readonly string[]>>): string[] {
  const everywhere = [...new Set(LOCALES.flatMap((locale) => present[locale]))].sort();
  return LOCALES.flatMap((locale) =>
    everywhere.filter((entry) => !present[locale].includes(entry)).map((entry) => `${locale}.${entry}`),
  );
}

function entriesOf(words: Words): string[] {
  return [
    ...Object.keys(words.works).map((id) => `works[${id}]`),
    ...Object.keys(words.experiences).map((id) => `experiences[${id}]`),
    ...Object.keys(words.education).map((id) => `education[${id}]`),
    ...Object.keys(words.skills).map((id) => `skills[${id}]`),
    ...Object.keys(words.terms).map((id) => `terms[${id}]`),
    ...words.certifications.map((row) => `certifications[${row.id}]`),
  ];
}

/**
 * The interface keys one published language carries and another does not.
 *
 * The translator reads one dictionary at a time, so it can never notice that
 * the other is missing a key: it answers the key itself and the page shows a
 * dotted path where a label belongs. The comparison therefore needs both
 * trees, and it is made in every direction rather than from French outwards.
 *
 * @param dictionaries - the interface tree of each published language
 * @returns one `locale.key.path` per key missing from that language, empty when they agree
 */
export function missingInterfaceKeys(dictionaries: Readonly<Record<Locale, Phrases>>): string[] {
  return absentPerLocale({
    fr: Object.keys(flatten(dictionaries.fr)),
    en: Object.keys(flatten(dictionaries.en)),
  });
}

/**
 * The content entries one published language carries and another does not.
 *
 * The types close most of this document — a work declared in the facts with no
 * words in one language does not compile. Two sections stay open and are the
 * ones this reads for: the certifications, which each language lists on its
 * own, and the translated terms, where a word given in one language alone
 * leaves the other silently showing the common name.
 *
 * @param documents - what each published language says
 * @returns one `locale.section[id]` per entry missing from that language, empty when they agree
 */
export function missingContentEntries(documents: Readonly<Record<Locale, Words>>): string[] {
  return absentPerLocale({ fr: entriesOf(documents.fr), en: entriesOf(documents.en) });
}

/**
 * The announced skills that no presented work and no listed experience backs.
 *
 * Backing is compared on identifiers rather than on labels: a skill, a work's
 * tool and an experience's tool are the same string in the facts, so the rule
 * holds without bringing two translated names together and calling them equal.
 *
 * @param groups - the skill groups as they are announced
 * @param backers - the works and the experiences the site actually presents
 * @returns one `skills.group[skill]` per unbacked skill, empty when every one is backed
 */
export function unbackedSkills(groups: readonly SkillsAnnounced[], backers: readonly ToolsUsed[]): string[] {
  const backed = new Set(backers.flatMap((backer) => backer.tools));
  return groups.flatMap((group) =>
    group.skills.filter((skill) => !backed.has(skill)).map((skill) => `skills.${group.id}[${skill}]`),
  );
}

/**
 * How many entries each section actually shows.
 *
 * @param content - the document a language displays
 * @returns the count of every counted section
 */
export function countedEntries(content: Content): Readonly<Record<SectionName, number>> {
  const journey = content.journey;
  return {
    works: content.works.length,
    experiences: journey.experiences.length,
    education: journey.education.length,
    certifications: journey.certifications.length,
    skills: journey.skills.flatMap((group) => group.skills).length,
  };
}

/**
 * The sections whose announced count is not the count of what they show.
 *
 * A number written by hand is right on the day it is written and false on the
 * day an entry is added, and nothing between the two says so: the section
 * announcing three entries and showing two is read as a fact about the person.
 *
 * @param content - the document a language displays
 * @param announced - the counts written rather than computed, sections omitted where none is
 * @returns one message per section at fault, empty when every announced count matches
 */
export function miscountedSections(
  content: Content,
  announced: Readonly<Partial<Record<SectionName, number>>>,
): string[] {
  const shown = countedEntries(content);
  return SECTIONS.filter((section) => announced[section] !== undefined && announced[section] !== shown[section]).map(
    (section) => `counts.${section}: ${announced[section]} announced, ${shown[section]} shown`,
  );
}

/**
 * Everything the published site leaves incomplete, on the state of the repository.
 *
 * The counts of one language are announced to the other, so a section showing
 * four entries in French and three in English is refused by the same rule that
 * refuses a hand-written number.
 *
 * @returns one message per fault, empty when both languages are complete
 */
export function completenessFaults(): string[] {
  return [
    ...missingInterfaceKeys(DICTIONARIES),
    ...missingContentEntries({ fr: FRENCH, en: ENGLISH }),
    ...unbackedSkills(SKILL_GROUPS, [...WORKS, ...EXPERIENCES]),
    ...miscountedSections(contentFor("en"), countedEntries(contentFor("fr"))),
  ];
}
