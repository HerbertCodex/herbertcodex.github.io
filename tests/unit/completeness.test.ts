import { describe, expect, it } from "vitest";
import {
  completenessFaults,
  countedEntries,
  miscountedSections,
  missingContentEntries,
  missingInterfaceKeys,
  unbackedSkills,
} from "~/shared/completeness";
import { contentFor } from "~/shared/content";
import { ENGLISH } from "~/shared/content/en";
import { FRENCH } from "~/shared/content/fr";
import { EXPERIENCES, SKILL_GROUPS, WORKS, type Words } from "~/shared/content/facts";

function withoutWork(words: Words, id: string): Words {
  const works: Record<string, unknown> = { ...words.works };
  delete works[id];
  return { ...words, works } as unknown as Words;
}

describe("la complétude des traductions", () => {
  it("refuse une clé d'interface présente dans une langue et absente dans l'autre, dans les deux sens", () => {
    const complete = { bar: { skip: "Aller au contenu" }, nav: { home: "Accueil", works: "Réalisations" } };
    const shortened = { bar: { skip: "Skip to content" }, nav: { home: "Home" } };

    expect(missingInterfaceKeys({ fr: complete, en: complete })).toEqual([]);
    expect(missingInterfaceKeys({ fr: complete, en: shortened })).toEqual(["en.nav.works"]);
    expect(missingInterfaceKeys({ fr: shortened, en: complete })).toEqual(["fr.nav.works"]);
  });

  it("refuse une entrée de contenu présente dans une langue et absente dans l'autre, dans les deux sens", () => {
    expect(missingContentEntries({ fr: FRENCH, en: ENGLISH })).toEqual([]);

    expect(missingContentEntries({ fr: FRENCH, en: withoutWork(ENGLISH, "decodevoyage") })).toEqual([
      "en.works[decodevoyage]",
    ]);
    expect(missingContentEntries({ fr: withoutWork(FRENCH, "paiement"), en: ENGLISH })).toEqual(["fr.works[paiement]"]);

    const certified: Words = {
      ...FRENCH,
      certifications: [{ id: "essai", body: "Organisme", subject: "Objet", obtainedAt: "2026-01" }],
    };
    expect(missingContentEntries({ fr: certified, en: ENGLISH })).toEqual(["en.certifications[essai]"]);
  });
});

describe("l'adossement des compétences", () => {
  it("refuse une compétence qu'aucune réalisation présentée ni aucune expérience listée n'adosse", () => {
    const presented = [...WORKS, ...EXPERIENCES];

    expect(unbackedSkills(SKILL_GROUPS, presented)).toEqual([]);
    expect(unbackedSkills([{ id: "devops", skills: ["kubernetes"] }], presented)).toEqual([
      "skills.devops[kubernetes]",
    ]);
    expect(unbackedSkills([{ id: "devops", skills: ["docker"] }], [])).toEqual(["skills.devops[docker]"]);
  });

  it("tient une réalisation présentée et une expérience listée pour deux adossements distincts", () => {
    expect(unbackedSkills([{ id: "data", skills: ["stripe"] }], WORKS)).toEqual([]);
    expect(unbackedSkills([{ id: "security", skills: ["jwt"] }], EXPERIENCES)).toEqual([]);
    expect(unbackedSkills([{ id: "security", skills: ["jwt"] }], WORKS)).toEqual(["skills.security[jwt]"]);
  });
});

describe("les compteurs de section", () => {
  it("suivent les entrées réellement affichées, et refusent un compteur écrit à la main", () => {
    const french = contentFor("fr");
    const counted = countedEntries(french);

    expect(counted.works).toBe(french.works.length);
    expect(counted.experiences).toBe(french.journey.experiences.length);
    expect(counted.education).toBe(french.journey.education.length);
    expect(counted.certifications).toBe(0);
    expect(counted.skills).toBe(french.journey.skills.flatMap((group) => group.skills).length);
    expect(miscountedSections(french, counted)).toEqual([]);

    expect(miscountedSections(french, { skills: 44, certifications: 3 })).toEqual([
      "counts.certifications: 3 announced, 0 shown",
      `counts.skills: 44 announced, ${counted.skills} shown`,
    ]);

    const grown = { ...french, works: [...french.works, french.works[0]] };
    expect(miscountedSections(grown, counted)).toEqual([
      `counts.works: ${counted.works} announced, ${counted.works + 1} shown`,
    ]);
  });
});

describe("la vérification de complétude", () => {
  it("passe sur l'état du dépôt, les deux langues étant complètes", () => {
    expect(completenessFaults()).toEqual([]);
  });
});
