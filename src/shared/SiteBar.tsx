import { useLocation } from "@solidjs/router";
import { For, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import LanguageSwitch from "~/shared/LanguageSwitch";
import ThemeToggle from "~/shared/ThemeToggle";
import { useI18n } from "~/shared/i18n";
import { PERSON } from "~/shared/identity";
import { NAMED_PAGES, addressOf, anchorOf } from "~/shared/pages";
import "./SiteBar.css";

type SiteBarProps = {
  readonly contentId: string;
};

/**
 * The section the address names, or nothing when it names none.
 *
 * The router's own address is the source, and the window's hash only fills in
 * when the router carries none. That order is the opposite of the obvious one,
 * and it was measured rather than reasoned: when the reader clicks a link of
 * the menu, the router knows the new anchor BEFORE the browser's address bar
 * shows it. Reading the window first marked the link for an instant, then
 * cleared it — measured on 2026-09-10.
 *
 * Nothing else announces such a click: the router answers it by pushing the
 * address itself, which emits neither `hashchange` nor `popstate`. The address
 * is therefore read again on every router navigation, on `hashchange` for a
 * hash the browser resolves alone, and once the page comes alive — which is how
 * a shared link arrives already marked.
 *
 * It is read rather than remembered. A mark held in a variable of our own would
 * disagree with the address bar the day the reader goes back.
 *
 * The server cannot know any of it: a hash never leaves the browser. The mark
 * appears once the page is live, which a reader who has just clicked does not
 * see happen.
 *
 * @returns the anchor in force, empty before hydration and outside any section
 */
function anchorInForce() {
  const address = useLocation();
  const [reached, setReached] = createSignal("");
  const read = () => {
    const said = address.hash === "" ? globalThis.location.hash : address.hash;
    setReached(decodeURIComponent(said.slice(1)));
  };

  createEffect(() => {
    /* Lues pour etre SUIVIES : c'est ce qui fait relire l'ancre a chaque navigation. */
    void address.pathname;
    void address.hash;
    read();
  });

  onMount(() => {
    globalThis.addEventListener("hashchange", read);
    onCleanup(() => globalThis.removeEventListener("hashchange", read));
  });

  return reached;
}

/**
 * The bar every page carries: the way out, the three sections, the languages and the theme.
 *
 * The link of the section being read carries `aria-current="location"` — the
 * value ARIA defines for a place WITHIN a document, where `page` names a
 * document among several. The site publishes one page per language since the
 * decision 0018, so `page` would have been a small lie repeated on every link.
 *
 * @param props - the identifier of the element the skip link leads to
 * @returns the skip link and the header bar, in the language in force
 */
export default function SiteBar(props: SiteBarProps) {
  const { locale, t } = useI18n();
  const reached = anchorInForce();
  return (
    <>
      <a class="skip" href={`#${props.contentId}`}>
        {t("bar.skip")}
      </a>
      <header class="bar">
        <span class="mark">{PERSON}</span>
        <nav aria-label={t("bar.nav")}>
          <For each={NAMED_PAGES}>
            {(page) => (
              <a
                href={addressOf(page, locale())}
                aria-current={anchorOf(page, locale()) === reached() ? "location" : undefined}
              >
                {t(`nav.${page.key}`)}
              </a>
            )}
          </For>
        </nav>
        <LanguageSwitch />
        <ThemeToggle />
      </header>
    </>
  );
}
