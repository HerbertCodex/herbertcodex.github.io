import { Title } from "@solidjs/meta";
import { useI18n } from "~/shared/i18n";

/**
 * The page presenting what has been built. Its content belongs to i-802r.
 *
 * @returns the works page, in the language in force
 */
export default function WorksPage() {
  const { t } = useI18n();
  return (
    <main>
      <Title>{t("works.title")}</Title>
      <h1>{t("works.heading")}</h1>
    </main>
  );
}
