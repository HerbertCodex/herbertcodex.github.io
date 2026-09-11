import { For } from "solid-js";
import { useI18n } from "~/shared/i18n";
import "./Opening.css";

const FACTS = ["contract", "place", "education", "languages"] as const;

/**
 * The opening of the page: who is speaking, in one sentence and four facts.
 *
 * It carries the page's only `h1`, and no section head: the mockup opens on
 * the name, the sentence and the facts, then goes straight to the work.
 *
 * The sentence and the facts sit in one block because a wide screen puts them
 * SIDE BY SIDE — the reading line stops at 64 characters, and the ~500 px it
 * left empty beside itself were measured on the published site.
 *
 * The list of ways into the other pages that used to close it is gone with
 * them. Neither mockup ever drew it — it existed only because the site had
 * four addresses, and the bar's menu now leads to the sections it listed.
 *
 * @returns the opening of the single page, in the language in force
 */
export default function Opening() {
  const { t } = useI18n();
  return (
    <>
      <h1>{t("home.heading")}</h1>
      <div class="opening">
        <p class="lede">{t("home.lede")}</p>
        <ul class="facts">
          <For each={FACTS}>{(fact) => <li>{t(`home.facts.${fact}`)}</li>}</For>
        </ul>
      </div>
    </>
  );
}
