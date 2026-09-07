import { Title } from "@solidjs/meta";
import { For, useContext } from "solid-js";
import { DICTIONARIES, I18nContext, LOCALES, type Locale } from "~/shared/i18n";
import "./NotFoundPage.css";

type Line = "title" | "heading" | "lede" | "home";

type Way = {
  readonly href: string;
  readonly label: string;
};

/*
 * La langue est LUE dans le contexte, jamais exigee. `useI18n` leve quand
 * aucun fournisseur ne l'entoure, et c'est exactement la moitie des points
 * d'entree de cet ecran : /fr/inconnu passe par le repli de la route commune,
 * DANS la mise en page qui porte le fournisseur, tandis que /de/x et
 * /nimportequoi passent par la route de tete, hors d'elle. Le prerendu ne
 * visite jamais cette seconde moitie — personne ne verrait la levee avant un
 * visiteur reel.
 *
 * Et les mots viennent des dictionnaires plutot que du traducteur, y compris
 * quand une langue EST en force. Le traducteur n'en tient qu'une, alors que cet
 * ecran est le seul du site a devoir en dire deux d'un coup ; passer par lui
 * dans un cas et par les dictionnaires dans l'autre ecrirait deux fois le meme
 * balisage, pour une chaine que ni l'un ni l'autre ne compose.
 */
function said(line: Line, locales: readonly Locale[]): string {
  return locales.map((locale) => DICTIONARIES[locale].notFound[line]).join(" · ");
}

/**
 * The screen an address the site does not publish leads to.
 *
 * Under a published language prefix it speaks that language and leads back to
 * its home. Reached outside any published prefix, it does not guess which
 * language the visitor reads: it says the same thing in both and offers both
 * ways back, because guessing wrong there is a worse answer than offering two.
 *
 * @returns the not-found page, in the language in force when there is one
 */
export default function NotFoundPage() {
  const i18n = useContext(I18nContext);
  const spoken = () => (i18n === undefined ? LOCALES : [i18n.locale()]);
  const ways = (): readonly Way[] =>
    spoken().map((locale) => ({ href: `/${locale}`, label: DICTIONARIES[locale].notFound.home }));
  return (
    <main class="not-found">
      <Title>{said("title", spoken())}</Title>
      <h1>{said("heading", spoken())}</h1>
      <p>{said("lede", spoken())}</p>
      <div class="links">
        <For each={ways()}>{(way) => <a href={way.href}>{way.label}</a>}</For>
      </div>
    </main>
  );
}
