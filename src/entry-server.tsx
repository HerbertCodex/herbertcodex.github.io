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
          <link rel="icon" href="/favicon.ico" />
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
