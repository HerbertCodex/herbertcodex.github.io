import { describe, expect, it } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import SiteFooter, { signatureAt } from "~/shared/SiteFooter";
import { createI18n, I18nContext, type Locale } from "~/shared/i18n";

function mount(locale: Locale) {
  return render(() => (
    <I18nContext.Provider value={createI18n(() => locale)}>
      <SiteFooter />
    </I18nContext.Provider>
  ));
}

describe("le pied de page", () => {
  it("porte un nom accessible écrit dans la langue de la page", () => {
    const french = mount("fr");
    const name = french.getByRole("contentinfo").getAttribute("aria-label") ?? "";
    expect(name).not.toBe("");
    cleanup();

    const english = mount("en");

    expect(english.queryByRole("contentinfo", { name })).toBeNull();
    cleanup();
  });
});

describe("la mention de signature", () => {
  it("porte l'année de la date qu'on lui donne, et non une année écrite dans le code", () => {
    expect(signatureAt(new Date("2031-03-03T10:00:00"))).toContain("2031");
  });
});
