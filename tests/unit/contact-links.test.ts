import { describe, expect, it } from "vitest";
import { CONTACT_CALL, contactMeans, malformedContactLinks, type ContactMeans } from "~/features/contact/ContactLinks";
import { LOCALES } from "~/shared/i18n";
import { resumeOf, type Resume } from "~/shared/resume";

const PUBLISHED: Resume = { href: "/cv/donatien-koffi-fr.pdf", file: "public/cv/donatien-koffi-fr.pdf" };

const KEYS: readonly ContactMeans["key"][] = ["linkedin", "github", "cv"];

/* Vide, blanche, relative, en http, tronquee — les cinq formes d'une cible fautive, moyen par moyen. */
const FAULTY: Record<ContactMeans["key"], readonly string[]> = {
  linkedin: [
    "",
    "   ",
    "linkedin.com/in/donatien-koffi",
    "http://linkedin.com/in/donatien-koffi",
    "https://linkedin.com",
  ],
  github: ["", "   ", "github.com/HerbertCodex", "http://github.com/HerbertCodex", "https://github.com"],
  cv: ["", "   ", "cv/donatien-koffi-fr.pdf", "http://exemple.fr/cv/donatien-koffi-fr.pdf", "/cv/"],
};

describe("les moyens de contact du second rang", () => {
  it("range le CV derrière GitHub, et seulement pour une langue qui en publie un", () => {
    expect(contactMeans("fr", undefined).map((mean) => mean.key)).toEqual(["github"]);
    expect(contactMeans("fr", PUBLISHED).map((mean) => mean.key)).toEqual(["github", "cv"]);
    expect(contactMeans("fr", PUBLISHED)[1].href).toBe(PUBLISHED.href);
  });

  /*
   * Le CV est porte par `resume.ts`, qui le publie aussi pour la page du
   * parcours. Ce test tient le cablage, pas le contenu du dossier : sans lui,
   * une seconde declaration pourrait s'installer ici et rappeler le CV au
   * contact alors que le parcours ne le propose plus. La confrontation de la
   * declaration au depot appartient a `tests/unit/cv.test.ts`, qui la tient
   * deja dans les deux sens.
   */
  it("lit le CV publié par le module qui le porte, sans seconde déclaration", () => {
    for (const locale of LOCALES) {
      const announced = contactMeans(locale).find((mean) => mean.key === "cv");
      expect(announced?.href, locale).toBe(resumeOf(locale)?.href);
    }
  });
});

describe("la garde des liens de contact", () => {
  it("accepte les cibles réellement renseignées du dépôt", () => {
    expect(malformedContactLinks([CONTACT_CALL, ...contactMeans("fr", PUBLISHED)])).toEqual([]);
    expect(malformedContactLinks([CONTACT_CALL, ...contactMeans("en", undefined)])).toEqual([]);
  });

  it("nomme la clé fautive d'une cible vide, relative, en http ou tronquée, pour chacun des trois moyens", () => {
    for (const key of KEYS) {
      for (const href of FAULTY[key]) {
        expect(malformedContactLinks([{ key, href }]), `${key} « ${href} »`).toEqual([key]);
      }
    }
  });

  /*
   * Le bras adresse est parti avec l'adresse. Ce que ce test tient est qu'il
   * n'a rien laisse derriere lui : la garde ne fabrique plus de faute pour un
   * moyen qu'on ne lui donne pas, alors qu'elle en nommait une — « email » —
   * des que la chaine attendue manquait.
   */
  it("ne connaît plus de bras adresse : sans moyen, elle ne nomme aucune faute", () => {
    expect(malformedContactLinks([])).toEqual([]);
  });
});
