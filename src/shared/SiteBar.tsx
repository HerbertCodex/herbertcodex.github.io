import { For, createSignal, onCleanup, onMount } from "solid-js";
import LanguageSwitch from "~/shared/LanguageSwitch";
import ThemeToggle from "~/shared/ThemeToggle";
import { useI18n, type Locale } from "~/shared/i18n";
import { PERSON } from "~/shared/identity";
import { SECTIONS, addressOfSection } from "~/shared/pages";
import "./SiteBar.css";

type SiteBarProps = {
  readonly contentId: string;
};

/**
 * The section being read, named by the anchor it answers to.
 *
 * It is decided by ONE line across the window — the reading line — and by the
 * rule that the section in force is the LAST whose heading has passed above it.
 * Nothing is marked until the first heading does, which is the truth at the top
 * of the page: the opening belongs to no section.
 *
 * The line is not a number of our own. It is `scroll-padding-top`, the reserve
 * the stylesheet already keeps under the bar, which is exactly where the
 * browser puts a heading a reader has just clicked. Clicking and scrolling
 * therefore agree by construction rather than by coincidence, and the line
 * follows the reserve when a media query moves it.
 *
 * Reading positions rather than remembering a choice is also what makes the
 * mark honest in every other case: a shared link scrolls the page before this
 * ever runs, and the back button scrolls it again.
 *
 * @param locale - the language in force, whose anchors name the sections
 * @returns the anchor in force, empty at the top of the page and before hydration
 */
function anchorInForce(locale: () => Locale) {
  const [reached, setReached] = createSignal("");

  onMount(() => {
    let asked = false;
    const read = () => {
      asked = false;
      const reserve = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
      const line = Number.isNaN(reserve) ? 0 : reserve;
      const anchors = SECTIONS.map((section) => section.slugs[locale()]).filter(
        (anchor) => document.getElementById(anchor) != null,
      );
      let current = "";
      for (const anchor of anchors) {
        /* Le pixel de tolerance absorbe l'arrondi d'un defilement fractionnaire. */
        if ((document.getElementById(anchor)?.getBoundingClientRect().top ?? Infinity) <= line + 1) current = anchor;
      }

      /*
       * Le bas de la page, qui est le seul endroit ou la regle de la ligne ne
       * suffit pas : la DERNIERE section ne peut pas atteindre la ligne, parce
       * que la page ne defile pas au-dela de sa fin. Mesure a 1440 px — il
       * manque 314 px de defilement pour y amener le titre du contact, donc
       * sans ce cas la derniere section n'aurait jamais ete marquee.
       *
       * Un lecteur arrive en bas lit la fin : c'est la derniere section, et
       * cela ne se deduit d'aucune position de titre.
       */
      const bottom =
        globalThis.innerHeight + Math.ceil(globalThis.scrollY) >= document.documentElement.scrollHeight - 1;
      if (bottom && anchors.length > 0) current = anchors[anchors.length - 1]!;

      setReached(current);
    };

    /*
     * Une lecture par image au plus. Un evenement de defilement arrive des
     * dizaines de fois par seconde, et mesurer une position a chaque fois fait
     * recalculer la mise en page autant de fois.
     */
    const ask = () => {
      if (asked) return;
      asked = true;
      requestAnimationFrame(read);
    };

    read();
    globalThis.addEventListener("scroll", ask, { passive: true });
    /* La reserve change avec la largeur : la ligne de lecture doit suivre. */
    globalThis.addEventListener("resize", ask, { passive: true });
    onCleanup(() => {
      globalThis.removeEventListener("scroll", ask);
      globalThis.removeEventListener("resize", ask);
    });
  });

  return reached;
}

/**
 * The bar every page carries: the way out, the sections, the languages and the theme.
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
  const reached = anchorInForce(locale);
  return (
    <>
      <a class="skip" href={`#${props.contentId}`}>
        {t("bar.skip")}
      </a>
      <header class="bar">
        <span class="mark">{PERSON}</span>
        <nav aria-label={t("bar.nav")}>
          <For each={SECTIONS}>
            {(section) => (
              <a
                href={addressOfSection(section, locale())}
                aria-current={section.slugs[locale()] === reached() ? "location" : undefined}
              >
                {t(section.label)}
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
