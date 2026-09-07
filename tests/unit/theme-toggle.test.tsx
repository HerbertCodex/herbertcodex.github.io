import { beforeEach, describe, expect, it } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import ThemeToggle from "~/shared/ThemeToggle";
import { createI18n, I18nContext, LOCALES, type Locale } from "~/shared/i18n";

function mount(locale: Locale) {
  return render(() => (
    <I18nContext.Provider value={createI18n(() => locale)}>
      <ThemeToggle />
    </I18nContext.Provider>
  ));
}

/*
 * Le nom que le bouton DOIT porter dans une langue. Il est lu du dictionnaire
 * plutôt que recopié ici : ce qui est en jeu est que le nom suive la langue de
 * la page, pas qu'il soit tel ou tel mot.
 */
function nameIn(locale: Locale): string {
  return String(createI18n(() => locale).t("bar.theme") ?? "");
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

  it("montre une icône dont le tracé change avec le mode", () => {
    const { getByRole } = mount("fr");
    const button = getByRole("button");
    const drawn = button.querySelector("svg")?.innerHTML ?? "";

    expect(drawn.trim(), "le bouton ne porte aucune icône, ou une icône vide").not.toBe("");

    button.click();

    expect(button.querySelector("svg")?.innerHTML ?? "", "l'icône est la même dans les deux modes").not.toBe(drawn);
    cleanup();
  });

  /*
   * Le nom accessible est lu par la requête de rôle, qui le calcule comme une
   * technologie d'assistance le ferait. Comparer un `textContent` cesserait de
   * dire quoi que ce soit dès que le bouton porte une icône.
   */
  it("porte un nom accessible écrit dans la langue de la page", () => {
    const names = LOCALES.map(nameIn);

    expect(new Set(names).size, `les langues nomment le bouton « ${names.join(" » et « ")} »`).toBe(LOCALES.length);
    for (const name of names) expect(name.trim(), "une langue laisse le bouton sans nom").not.toBe("");

    LOCALES.forEach((locale, rank) => {
      const view = mount(locale);

      expect(view.queryByRole("button", { name: names[rank] }), `${locale} : nom attendu absent`).not.toBeNull();
      names.forEach((name, other) => {
        if (other !== rank) expect(view.queryByRole("button", { name }), `${locale} : porte « ${name} »`).toBeNull();
      });
      cleanup();
    });
  });
});
