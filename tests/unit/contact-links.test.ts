import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CONTACT_EMAIL, contactMeans, malformedContactLinks, type ContactMeans } from "~/shared/ContactLinks";
import { LOCALES } from "~/shared/i18n";

const RESUME = (locale: string): string => `public/cv/donatien-koffi-${locale}.pdf`;

describe("les moyens de contact du second rang", () => {
  it("range le CV derrière LinkedIn et GitHub, et seulement pour une langue qui en publie un", () => {
    expect(contactMeans("fr", []).map((mean) => mean.key)).toEqual(["linkedin", "github"]);
    expect(contactMeans("fr", ["fr"]).map((mean) => mean.key)).toEqual(["linkedin", "github", "cv"]);
    expect(contactMeans("en", ["fr"]).map((mean) => mean.key)).toEqual(["linkedin", "github"]);
    expect(contactMeans("fr", ["fr"])[2].href).toBe("/cv/donatien-koffi-fr.pdf");
  });

  /*
   * Le CV est versionne par une autre issue, dans un dossier qu'elle reserve.
   * Sans ce test, une declaration qui ne suit pas le depot passe en silence
   * dans les deux sens : un CV depose et jamais annonce reste invisible pour
   * toujours, un CV annonce et jamais depose publie un lien qui ne mene nulle
   * part. Aucune des deux fautes n'est mal formee, donc la garde de forme ne
   * les voit pas.
   */
  it("n'annonce un CV que pour une langue dont le fichier est versionné dans le dépôt", () => {
    for (const locale of LOCALES) {
      const announced = contactMeans(locale).some((mean) => mean.key === "cv");
      expect(announced, RESUME(locale)).toBe(existsSync(RESUME(locale)));
    }
  });
});

describe("la garde des liens de contact", () => {
  it("accepte les cibles réellement renseignées du dépôt", () => {
    expect(malformedContactLinks(CONTACT_EMAIL, contactMeans("fr", ["fr"]))).toEqual([]);
    expect(malformedContactLinks(CONTACT_EMAIL, contactMeans("en", []))).toEqual([]);
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
