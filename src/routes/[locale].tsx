import { type RouteSectionProps } from "@solidjs/router";
import { createI18n, I18nContext, LOCALES, type Locale } from "~/shared/i18n";

/**
 * The route configuration: a segment naming no published language matches
 * nothing, so it reaches the catch-all rather than rendering the default.
 */
export const route = { matchFilters: { locale: [...LOCALES] } };

/**
 * The layout every localized page sits under.
 *
 * @param props - the route section, whose params carry the language segment
 * @returns the page, wrapped in the language its address named
 */
export default function LocaleLayout(props: RouteSectionProps) {
  const i18n = createI18n(() => props.params.locale as Locale);
  return (
    <I18nContext.Provider value={i18n}>
      <nav>
        <a href={`/${i18n.locale()}`}>{i18n.t("nav.home")}</a>
        <a href={`/${i18n.locale()}/about`}>{i18n.t("nav.about")}</a>
      </nav>
      {props.children}
    </I18nContext.Provider>
  );
}
