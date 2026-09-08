import { useParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import LanguageSwitch from "~/shared/LanguageSwitch";
import ThemeToggle from "~/shared/ThemeToggle";
import { useI18n, type Locale } from "~/shared/i18n";
import { PERSON } from "~/shared/identity";
import { PAGES, addressOf, type Page } from "~/shared/pages";
import "./SiteBar.css";

function pageAt(locale: Locale, slug: string): Page | undefined {
  return PAGES.find((page) => page.slugs[locale] === slug);
}

type SiteBarProps = {
  readonly contentId: string;
};

/**
 * The bar every page carries: the way out, the four pages, the languages and the theme.
 *
 * On an address designating no page, the language switch is absent rather
 * than pointing home: leading home is precisely the defect this issue
 * exists to prevent, and an address that names nothing has no counterpart
 * to lead to. The theme button sits outside that condition: it depends on
 * no page, so it is offered wherever the bar is.
 *
 * @param props - the identifier of the element the skip link leads to
 * @returns the skip link and the header bar, in the language in force
 */
export default function SiteBar(props: SiteBarProps) {
  const params = useParams();
  const { locale, t } = useI18n();
  const current = () => pageAt(locale(), params.slug ?? "");
  return (
    <>
      <a class="skip" href={`#${props.contentId}`}>
        {t("bar.skip")}
      </a>
      <header class="bar">
        <span class="mark">{PERSON}</span>
        <nav aria-label={t("bar.nav")}>
          <For each={PAGES}>
            {(page) => (
              <a href={addressOf(page, locale())} aria-current={page.key === current()?.key ? "page" : undefined}>
                {t(`nav.${page.key}`)}
              </a>
            )}
          </For>
        </nav>
        <Show when={current()}>{(page) => <LanguageSwitch page={page()} />}</Show>
        <ThemeToggle />
      </header>
    </>
  );
}
