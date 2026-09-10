import { For } from "solid-js";
import { LOCALES, useI18n, type Locale } from "~/shared/i18n";
import { HOME, addressOf } from "~/shared/pages";
import "./LanguageSwitch.css";

/*
 * Le nom d'une langue est écrit dans cette langue et n'est jamais traduit :
 * quelqu'un qui ne lit pas la page cherche le seul mot qu'il y reconnaîtra.
 * C'est aussi pourquoi ces noms ne sont pas dans les dictionnaires, où ils
 * auraient une version par langue de la page qui les affiche.
 */
const ENDONYMS: Readonly<Record<Locale, string>> = { fr: "Français", en: "English" };

/**
 * The links leading to the site in each published language.
 *
 * The site publishes ONE page per language since 2026-09-10, so there is no
 * longer a page to receive: the switch leads to the other language's page.
 *
 * What it deliberately does NOT do is carry the reader's place over. The
 * sections are named differently in each language — `#realisations` and
 * `#work` — and a prerendered document cannot know which one the reader has
 * scrolled to. Guessing would land them somewhere they were not.
 *
 * @returns one link per published language, the one in force marked as current
 */
export default function LanguageSwitch() {
  const { locale } = useI18n();
  return (
    <div class="langs">
      <For each={LOCALES}>
        {(candidate) => (
          <a
            class="lang"
            href={addressOf(HOME, candidate)}
            hreflang={candidate}
            lang={candidate}
            aria-current={candidate === locale() ? "true" : undefined}
          >
            <span aria-hidden="true">{candidate.toUpperCase()}</span>
            <span class="lang-name">{ENDONYMS[candidate]}</span>
          </a>
        )}
      </For>
    </div>
  );
}
