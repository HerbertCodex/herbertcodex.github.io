import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import { MetaProvider } from "@solidjs/meta";
import ContactSection from "~/features/contact/ContactSection";
import { createI18n, DICTIONARIES, I18nContext, LOCALES, type Locale } from "~/shared/i18n";

/*
 * L'adresse est ecrite ICI en toutes lettres, jamais importee du module qui la
 * portait : une constante partagee entre la source et son test disparait des
 * deux cotes en un seul remplacement, et le test suivrait le retrait au lieu
 * de le prouver.
 */
const ADDRESS = "kraherbertdonatienkoffi@gmail.com";
const LOCAL_PART = "kraherbertdonatienkoffi";

const LINKEDIN = "https://linkedin.com/in/donatien-koffi";

const TERMS = ["contract", "place", "start"] as const;

const SOURCES = ["src/features/contact/ContactSection.tsx", "src/features/contact/ContactLinks.tsx"];

const MOCKUP = "mockups/accueil-contact.html";

/* Ce que la maquette disait quand l'adresse etait l'appel, dans les deux langues du depot. */
const WRITING = [/Écrire un message/i, /Write a message/i];

function contactPage(locale: Locale) {
  return render(() => (
    <MetaProvider>
      <I18nContext.Provider value={createI18n(() => locale)}>
        <ContactSection rank={5} anchor="contact" />
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
  it("fait de LinkedIn l'appel principal, sous le libellé que le dictionnaire de la langue déclare", () => {
    for (const locale of LOCALES) {
      const { container } = contactPage(locale);
      const call = container.querySelector("a[href]");
      const name = call?.textContent?.trim() ?? "";

      expect(call?.getAttribute("href"), locale).toBe(LINKEDIN);
      expect(name, locale).toBe(DICTIONARIES[locale].contact.call);
      expect(name, locale).not.toContain("@");
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

  it("ne recueille aucun message : aucun formulaire, aucun envoi, aucune cible hors de ce site", () => {
    const { container } = contactPage("fr");

    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelectorAll("input, textarea, select, button")).toHaveLength(0);
    expect(hrefsOf(container).length).toBeGreaterThan(0);
    for (const href of hrefsOf(container)) expect(href, href).toMatch(/^(?:https:\/\/|\/)/);
    cleanup();

    for (const path of SOURCES) {
      const body = readFileSync(path, "utf8");
      expect(body, path).not.toMatch(/fetch\s*\(|XMLHttpRequest|sendBeacon|<form|method=|action=/);
    }
  });

  it("tient la maquette de référence au même contrat : ni adresse, ni écriture de message, l'appel du dictionnaire", () => {
    const drawn = readFileSync(MOCKUP, "utf8");

    expect(drawn).not.toContain(ADDRESS);
    expect(drawn).not.toContain(LOCAL_PART);
    for (const saying of WRITING) expect(drawn, String(saying)).not.toMatch(saying);
    expect(drawn).toContain(DICTIONARIES.fr.contact.call);
  });
});
