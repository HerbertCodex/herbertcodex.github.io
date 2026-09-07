import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import { MetaProvider } from "@solidjs/meta";
import ContactPage from "~/features/contact/ContactPage";
import { createI18n, I18nContext, LOCALES, type Locale } from "~/shared/i18n";

/*
 * L'adresse est ecrite en toutes lettres ICI, pas importee du module qu'elle
 * verifie. Une constante partagee entre la source et son test se renomme des
 * deux cotes en un seul remplacement, et le test suit la faute au lieu de la
 * refuser : c'est exactement ce que le critere « toute modification de cette
 * chaine fait echouer un test » interdit.
 */
const ADDRESS = "kraherbertdonatienkoffi@gmail.com";

const LINKEDIN = "https://linkedin.com/in/donatien-koffi";
const GITHUB = "https://github.com/HerbertCodex";

const TERMS = ["contract", "place", "start"] as const;

const SOURCES = ["src/features/contact/ContactPage.tsx", "src/features/contact/ContactLinks.tsx"];

function contactPage(locale: Locale) {
  return render(() => (
    <MetaProvider>
      <I18nContext.Provider value={createI18n(() => locale)}>
        <ContactPage />
      </I18nContext.Provider>
    </MetaProvider>
  ));
}

function hrefsOf(container: HTMLElement): string[] {
  return [...container.querySelectorAll("a[href]")].map((node) => node.getAttribute("href") ?? "");
}

function textsOf(container: HTMLElement, selector: string): string[] {
  return [...container.querySelectorAll(selector)].map((node) => node.textContent?.trim() ?? "");
}

describe("la prise de contact", () => {
  it("publie exactement l'adresse du CV, en clair et sans seconde adresse à côté", () => {
    for (const locale of LOCALES) {
      const { container } = contactPage(locale);

      expect(
        hrefsOf(container).filter((href) => href.startsWith("mailto:")),
        locale,
      ).toEqual([`mailto:${ADDRESS}`]);
      expect(container.textContent ?? "", locale).toContain(ADDRESS);
      expect(
        hrefsOf(container).filter((href) => href.includes("@")),
        locale,
      ).toHaveLength(1);
      cleanup();
    }
  });

  it("fait de la messagerie l'unique appel principal, LinkedIn puis GitHub venant derrière", () => {
    for (const locale of LOCALES) {
      const { container } = contactPage(locale);
      const means = hrefsOf(container).filter((href) => href.startsWith("mailto:") || href.startsWith("https://"));

      expect(means, locale).toEqual([`mailto:${ADDRESS}`, LINKEDIN, GITHUB]);
      cleanup();
    }
  });

  it("écrit ses conditions — contrat, lieu et mobilité, disponibilité — dans les deux langues", () => {
    for (const locale of LOCALES) {
      const { container } = contactPage(locale);
      const { t } = createI18n(() => locale);
      const labels = textsOf(container, "dt");
      const values = textsOf(container, "dd");

      expect(labels, locale).toHaveLength(TERMS.length);
      for (const term of TERMS) {
        const label = String(t(`contact.terms.${term}.label`) ?? "");
        const value = String(t(`contact.terms.${term}.value`) ?? "");
        expect(value.trim().length, `${locale}.${term}`).toBeGreaterThan(0);
        expect(value, `${locale}.${term}`).not.toBe(label);
        expect(labels, `${locale}.${term}`).toContain(label);
        expect(values, `${locale}.${term}`).toContain(value);
      }
      cleanup();
    }
  });

  it("ne recueille aucun message : aucun formulaire, aucun envoi, chaque lien ouvre l'outil du visiteur", () => {
    const { container } = contactPage("fr");

    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelectorAll("input, textarea, select, button")).toHaveLength(0);
    for (const href of hrefsOf(container)) expect(href, href).toMatch(/^(?:mailto:|https:\/\/|\/)/);
    cleanup();

    for (const path of SOURCES) {
      const body = readFileSync(path, "utf8");
      expect(body, path).not.toMatch(/fetch\s*\(|XMLHttpRequest|sendBeacon|<form|method=|action=/);
    }
  });
});
