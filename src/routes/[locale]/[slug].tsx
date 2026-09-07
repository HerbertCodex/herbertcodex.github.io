import { useParams } from "@solidjs/router";
import { Show, type Component } from "solid-js";
import { Dynamic } from "solid-js/web";
import NotFound from "~/routes/[...404]";
import ContactPage from "~/features/contact/ContactPage";
import JourneyPage from "~/features/journey/JourneyPage";
import WorksPage from "~/features/works/WorksPage";
import { isLocale } from "~/shared/i18n";
import { pageForSlug, type NamedPageKey } from "~/shared/pages";

const VIEWS: Record<NamedPageKey, Component> = {
  works: WorksPage,
  journey: JourneyPage,
  contact: ContactPage,
};

/**
 * The route serving every page the table names, home excepted.
 *
 * @returns the page the address designates, or the not-found page
 */
export default function NamedPageRoute() {
  const params = useParams();
  const page = () => {
    const locale = params.locale ?? "";
    return isLocale(locale) ? pageForSlug(locale, params.slug ?? "") : undefined;
  };
  return (
    <Show when={page()} fallback={<NotFound />}>
      {(found) => <Dynamic component={VIEWS[found().key]} />}
    </Show>
  );
}
