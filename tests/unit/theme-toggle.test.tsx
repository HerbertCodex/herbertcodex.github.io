import { beforeEach, describe, expect, it } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import ThemeToggle from "~/shared/ThemeToggle";
import { createI18n, I18nContext, type Locale } from "~/shared/i18n";

function mount(locale: Locale) {
  return render(() => (
    <I18nContext.Provider value={createI18n(() => locale)}>
      <ThemeToggle />
    </I18nContext.Provider>
  ));
}

describe("le bouton de thème", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("annonce le thème en vigueur, et l'annonce change quand le thème change", () => {
    const { getByRole } = mount("fr");
    const button = getByRole("button");

    expect(button.getAttribute("aria-pressed")).toBe("false");

    button.click();

    expect(button.getAttribute("aria-pressed")).toBe("true");
    cleanup();
  });

  it("porte un nom accessible écrit dans la langue de la page", () => {
    const french = mount("fr");
    const name = french.getByRole("button").textContent ?? "";
    expect(name).not.toBe("");
    cleanup();

    const english = mount("en");

    expect(english.queryByRole("button", { name })).toBeNull();
    cleanup();
  });
});
