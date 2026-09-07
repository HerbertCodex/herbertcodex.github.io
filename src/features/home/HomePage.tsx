import { Title } from "@solidjs/meta";
import { For } from "solid-js";
import { useI18n } from "~/shared/i18n";
import { NAMED_PAGES, addressOf } from "~/shared/pages";
import "./HomePage.css";

const FACTS = ["contract", "place", "education", "languages"] as const;

/**
 * The opening of the portfolio, and the way into each of the other pages.
 *
 * @returns the home page, in the language in force
 */
export default function HomePage() {
  const { locale, t } = useI18n();
  return (
    <main>
      <Title>{t("home.title")}</Title>
      <h1>{t("home.heading")}</h1>
      <p class="lede">{t("home.lede")}</p>
      <ul class="facts">
        <For each={FACTS}>{(fact) => <li>{t(`home.facts.${fact}`)}</li>}</For>
      </ul>
      <ul class="entries">
        <For each={NAMED_PAGES}>
          {(page, rank) => (
            <li>
              <a href={addressOf(page, locale())}>
                <span class="entry-rank">{String(rank() + 1).padStart(2, "0")}</span>
                <span class="entry-name">{t(`nav.${page.key}`)}</span>
                <span class="entry-line">{t(`home.entries.${page.key}`)}</span>
              </a>
            </li>
          )}
        </For>
      </ul>
    </main>
  );
}
