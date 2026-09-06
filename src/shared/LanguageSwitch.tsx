import { For } from "solid-js";
import { LOCALES, useI18n, type Locale } from "~/shared/i18n";
import { addressOf, type Page } from "~/shared/pages";
import "./LanguageSwitch.css";

/*
 * Le nom d'une langue est écrit dans cette langue et n'est jamais traduit :
 * quelqu'un qui ne lit pas la page cherche le seul mot qu'il y reconnaîtra.
 * C'est aussi pourquoi ces noms ne sont pas dans les dictionnaires, où ils
 * auraient une version par langue de la page qui les affiche.
 */
const ENDONYMS: Readonly<Record<Locale, string>> = { fr: "Français", en: "English" };

type LanguageSwitchProps = {
  readonly page: Page;
};

/**
 * The links leading to the page being read, in each published language.
 *
 * The page is received rather than read from the address: the switch leads
 * to the same page in the other language, and a component that guessed it
 * from the address would lead home the day a name changed.
 *
 * @param props - the page the address designates, whose other names the links carry
 * @returns one link per published language, the one in force marked as current
 */
export default function LanguageSwitch(props: LanguageSwitchProps) {
  const { locale } = useI18n();
  return (
    <div class="langs">
      <For each={LOCALES}>
        {(candidate) => (
          <a
            class="lang"
            href={addressOf(props.page, candidate)}
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
