import { type RouteSectionProps } from "@solidjs/router";
import { createI18n, I18nContext, LOCALES, type Locale } from "~/shared/i18n";
import SiteBar from "~/shared/SiteBar";

/**
 * The route configuration: a segment naming no published language matches
 * nothing, so it reaches the catch-all rather than rendering the default.
 */
export const route = { matchFilters: { locale: [...LOCALES] } };

/*
 * La cible du lien d'évitement est portée par la mise en page, pas par chaque
 * écran : le lien et sa cible sont alors écrits au même endroit, et aucune
 * page ne peut exister sans l'une des deux.
 */
const CONTENT_ID = "contenu";

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
      <SiteBar contentId={CONTENT_ID} />
      <div id={CONTENT_ID} tabindex="-1">
        {props.children}
      </div>
    </I18nContext.Provider>
  );
}
