import { describe, expect, it } from "vitest";
import { CONTACT_EMAIL, contactMeans, malformedContactLinks, type ContactMeans } from "~/shared/ContactLinks";
import { LOCALES } from "~/shared/i18n";
import { resumeOf, type Resume } from "~/shared/resume";

const PUBLISHED: Resume = { href: "/cv/donatien-koffi-fr.pdf", file: "public/cv/donatien-koffi-fr.pdf" };

describe("les moyens de contact du second rang", () => {
  it("range le CV derrière LinkedIn et GitHub, et seulement pour une langue qui en publie un", () => {
    expect(contactMeans("fr", undefined).map((mean) => mean.key)).toEqual(["linkedin", "github"]);
    expect(contactMeans("fr", PUBLISHED).map((mean) => mean.key)).toEqual(["linkedin", "github", "cv"]);
    expect(contactMeans("fr", PUBLISHED)[2].href).toBe(PUBLISHED.href);
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
    expect(malformedContactLinks(CONTACT_EMAIL, contactMeans("fr", PUBLISHED))).toEqual([]);
    expect(malformedContactLinks(CONTACT_EMAIL, contactMeans("en", undefined))).toEqual([]);
  });

  it("nomme une adresse vide ou mal formée plutôt que de la publier", () => {
    expect(malformedContactLinks("", contactMeans("fr"))).toEqual(["email"]);
    expect(malformedContactLinks("   ", contactMeans("fr"))).toEqual(["email"]);
    expect(malformedContactLinks("kraherbertdonatienkoffi", contactMeans("fr"))).toEqual(["email"]);
    expect(malformedContactLinks("kraherbertdonatienkoffi@gmail", contactMeans("fr"))).toEqual(["email"]);
  });

  it("nomme un lien vide ou mal formé plutôt que de le publier", () => {
    const empty: readonly ContactMeans[] = [{ key: "linkedin", href: "" }];
    const relative: readonly ContactMeans[] = [{ key: "github", href: "github.com/HerbertCodex" }];
    const insecure: readonly ContactMeans[] = [{ key: "linkedin", href: "http://linkedin.com/in/donatien-koffi" }];
    const truncated: readonly ContactMeans[] = [{ key: "cv", href: "/cv/" }];

    expect(malformedContactLinks(CONTACT_EMAIL, empty)).toEqual(["linkedin"]);
    expect(malformedContactLinks(CONTACT_EMAIL, relative)).toEqual(["github"]);
    expect(malformedContactLinks(CONTACT_EMAIL, insecure)).toEqual(["linkedin"]);
    expect(malformedContactLinks(CONTACT_EMAIL, truncated)).toEqual(["cv"]);
  });
});
