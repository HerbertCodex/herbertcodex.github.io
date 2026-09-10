import { Link, Meta, Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { Show } from "solid-js";
import NotFound from "~/routes/[...404]";
import { isLocale, useI18n } from "~/shared/i18n";
import { SITE } from "~/shared/identity";
import { addressOf, pageForSlug } from "~/shared/pages";

/**
 * The addresses that were pages until 2026-09-10, and now lead to an anchor.
 *
 * They are answered rather than dropped because a CV and a LinkedIn profile
 * carry `/fr/realisations` into the world, and a link already shared cannot be
 * recalled. The host is a static one: it offers no redirect of its own, so the
 * redirection is the document itself.
 *
 * Three things are written, and each answers a different reader. The refresh
 * sends a browser straight through — at zero delay, which is what keeps it out
 * of the accessibility rule that refuses a timed one. The canonical link tells
 * a search engine which address holds the content, so the six stubs never
 * compete with the two pages. The visible link answers whoever refuses the
 * automatic jump, and whoever arrives with no script at all.
 *
 * An unknown name still reaches the not-found screen: this route answers for
 * the names the table declares, and for nothing else.
 *
 * @returns the redirection to the section, or the not-found screen
 */
export default function SectionRedirect() {
  const params = useParams();
  const { locale: inForce, t } = useI18n();
  const page = () => {
    const locale = params.locale ?? "";
    return isLocale(locale) ? pageForSlug(locale, params.slug ?? "") : undefined;
  };
  return (
    <Show when={page()} fallback={<NotFound />}>
      {(found) => {
        const target = () => addressOf(found(), inForce());
        return (
          <main>
            <Title>{t(`nav.${found().key}`)}</Title>
            <Meta http-equiv="refresh" content={`0; url=${target()}`} />
            <Link rel="canonical" href={`${SITE}${target()}`} />
            <h1>{t(`nav.${found().key}`)}</h1>
            <p>{t(`home.entries.${found().key}`)}</p>
            <p>
              <a href={target()}>{t("moved.call")}</a>
            </p>
          </main>
        );
      }}
    </Show>
  );
}
