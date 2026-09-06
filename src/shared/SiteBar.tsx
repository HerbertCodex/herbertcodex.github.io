import { useParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import LanguageSwitch from "~/shared/LanguageSwitch";
import { useI18n, type Locale } from "~/shared/i18n";
import { PAGES, addressOf, type Page } from "~/shared/pages";
import "./SiteBar.css";

const MARK = "Donatien Koffi";

function pageAt(locale: Locale, slug: string): Page | undefined {
  return PAGES.find((page) => page.slugs[locale] === slug);
}

type SiteBarProps = {
  readonly contentId: string;
};

/**
 * The bar every page carries: the way out, the four pages, and the languages.
 *
 * On an address designating no page, the language switch is absent rather
 * than pointing home: leading home is precisely the defect this issue
 * exists to prevent, and an address that names nothing has no counterpart
 * to lead to.
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
        <span class="mark">{MARK}</span>
        <nav aria-label={t("bar.nav")}>
          <For each={PAGES}>{(page) => <a href={addressOf(page, locale())}>{t(`nav.${page.key}`)}</a>}</For>
        </nav>
        <Show when={current()}>{(page) => <LanguageSwitch page={page()} />}</Show>
      </header>
    </>
  );
}
