// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import { getRequestEvent } from "solid-js/web";
import { DEFAULT_LOCALE, isLocale } from "~/shared/i18n";

/**
 * Reads the language of the document being rendered from its own address.
 *
 * The document is rendered outside the router, so it cannot reach the route
 * params. It reads the request instead, which is the source the router reads
 * too and therefore cannot disagree with.
 *
 * @returns the language named by the address, or the default language
 */
function documentLocale() {
  const url = getRequestEvent()?.request.url;
  if (url === undefined) return DEFAULT_LOCALE;
  const segment = new URL(url).pathname.split("/")[1] ?? "";
  return isLocale(segment) ? segment : DEFAULT_LOCALE;
}

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang={documentLocale()}>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {/*
           * La marque de la barre, reduite a ses initiales. Le SVG passe en
           * premier : un navigateur qui le lit le prend a toute taille, et
           * ignore le PNG. Celui qui ne le lit pas tombe sur le PNG, qui
           * existe pour cette raison seule. Les deux sont rendus depuis le
           * meme SVG, jamais dessines deux fois.
           */}
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          {/*
           * Bloquant, et avant les feuilles de style : le fil de rendu
           * s'arrete ici, pose l'attribut, et la page n'est jamais peinte
           * dans un theme que le lecteur n'a pas demande. Un module differe
           * s'executerait apres la premiere peinture, donc apres le
           * clignotement.
           */}
          <script src="/theme.js" />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
