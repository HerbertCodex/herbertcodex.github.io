import { describe, expect, it } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import LanguageSwitch from "~/shared/LanguageSwitch";
import { createI18n, I18nContext } from "~/shared/i18n";

describe("le lien qui change de langue", () => {
  it("annonce la langue vers laquelle il conduit, pas celle en cours", () => {
    const { getByRole } = render(() => (
      <I18nContext.Provider value={createI18n(() => "fr")}>
        <LanguageSwitch />
      </I18nContext.Provider>
    ));

    const toEnglish = getByRole("link", { name: "English" });
    // La page anglaise, et non une section de celle-ci : le document prerendu
    // ne peut pas savoir ou le lecteur a defile, et l'y renvoyer au hasard
    // serait pire que de l'accueillir en haut.
    expect(toEnglish.getAttribute("href")).toBe("/en");
    expect(toEnglish.getAttribute("hreflang")).toBe("en");
    cleanup();
  });
});
