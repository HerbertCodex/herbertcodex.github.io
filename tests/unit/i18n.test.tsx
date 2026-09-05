import { describe, expect, it } from "vitest";
import { createSignal } from "solid-js";
import { render, cleanup } from "@solidjs/testing-library";
import { createI18n, I18nContext, isLocale, useI18n, type Locale } from "~/shared/i18n";

function Consumer() {
  const { t } = useI18n();
  return <p>{t("nav.about")}</p>;
}

describe("the language in force", () => {
  it("reaches a component that displays text, without that component reading the address", () => {
    const [locale, setLocale] = createSignal<Locale>("fr");
    const { getByText } = render(() => (
      <I18nContext.Provider value={createI18n(locale)}>
        <Consumer />
      </I18nContext.Provider>
    ));

    expect(getByText("À propos")).toBeTruthy();
    setLocale("en");
    expect(getByText("About")).toBeTruthy();
    cleanup();
  });

  it("refuses rather than guessing when no provider states it", () => {
    expect(() => useI18n()).toThrow(/outside the locale provider/);
  });

  it("is refused for an address segment that names no published language", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale("")).toBe(false);
  });
});

describe("the internationalisation library", () => {
  it("is the one resolving a nested key, which the dictionaries never do themselves", () => {
    expect(createI18n(() => "en").t("nav.about")).toBe("About");
    expect(createI18n(() => "fr").t("nav.about")).toBe("À propos");
  });
});
