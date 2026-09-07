import { describe, expect, it } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import LanguageSwitch from "~/shared/LanguageSwitch";
import { createI18n, I18nContext } from "~/shared/i18n";
import { PAGES } from "~/shared/pages";

const WORKS = PAGES.filter((page) => page.key === "works")[0];

describe("le lien qui change de langue", () => {
  it("annonce la langue vers laquelle il conduit, pas celle en cours", () => {
    const { getByRole } = render(() => (
      <I18nContext.Provider value={createI18n(() => "fr")}>
        <LanguageSwitch page={WORKS} />
      </I18nContext.Provider>
    ));

    const toEnglish = getByRole("link", { name: "English" });
    expect(toEnglish.getAttribute("href")).toBe("/en/work");
    expect(toEnglish.getAttribute("hreflang")).toBe("en");
    cleanup();
  });
});
