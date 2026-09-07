import { Meta, Title } from "@solidjs/meta";
import { DEFAULT_LOCALE } from "~/shared/i18n";

/**
 * The root address, which leads to the default language.
 *
 * @returns the page that redirects to the default language, and links to it
 */
export default function RootRedirect() {
  return (
    <main>
      <Title>Portfolio</Title>
      <Meta http-equiv="refresh" content={`0; url=/${DEFAULT_LOCALE}`} />
      <h1>Portfolio</h1>
      <p>
        <a href={`/${DEFAULT_LOCALE}`}>Continuer en français</a>
      </p>
    </main>
  );
}
