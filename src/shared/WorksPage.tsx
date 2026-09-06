import { Title } from "@solidjs/meta";
import { For } from "solid-js";
import WorkCard from "~/shared/WorkCard";
import { contentFor } from "~/shared/content";
import { useI18n } from "~/shared/i18n";
import "./WorksPage.css";

/**
 * The page presenting what has been built, in the order the content declares.
 *
 * That order is read, never computed: it opens on the work this very site is
 * built by, and a sort by date or by name would put something else there.
 *
 * @returns the works page, in the language in force
 */
export default function WorksPage() {
  const { locale, t } = useI18n();
  const works = () => contentFor(locale()).works;
  return (
    <main class="works">
      <Title>{t("works.title")}</Title>
      <div class="section-head">
        <h1>{t("works.heading")}</h1>
        <span class="count">{String(works().length).padStart(2, "0")}</span>
      </div>
      <For each={works()}>{(work) => <WorkCard work={work} />}</For>
    </main>
  );
}
