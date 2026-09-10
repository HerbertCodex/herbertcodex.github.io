import { Style } from "@solidjs/meta";
import { For } from "solid-js";
import WorkCard, { routeSheetOf } from "./WorkCard";
import SectionHead from "~/shared/SectionHead";
import { contentFor } from "~/shared/content";
import { useI18n } from "~/shared/i18n";
import "./WorksSection.css";

type WorksSectionProps = {
  readonly rank: number;
  readonly anchor: string;
};

/**
 * The section presenting what has been built, in the order the content declares.
 *
 * That order is read, never computed: it opens on the work this very site is
 * built by, and a sort by date or by name would put something else there.
 *
 * @param props - the rank this section carries in the page, and its anchor
 * @returns the works section, in the language in force
 */
export default function WorksSection(props: WorksSectionProps) {
  const { locale, t } = useI18n();
  const works = () => contentFor(locale()).works;
  return (
    <section class="works" aria-labelledby={props.anchor}>
      <Style>{routeSheetOf(works())}</Style>
      <SectionHead rank={props.rank} name={t("works.heading")} headingId={props.anchor} count={works().length} />
      <For each={works()}>{(work) => <WorkCard work={work} />}</For>
    </section>
  );
}
