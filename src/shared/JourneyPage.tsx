import { Title } from "@solidjs/meta";
import { useI18n } from "~/shared/i18n";

/**
 * The page presenting experience and training. Its content belongs to i-2wjm.
 *
 * @returns the journey page, in the language in force
 */
export default function JourneyPage() {
  const { t } = useI18n();
  return (
    <main>
      <Title>{t("journey.title")}</Title>
      <h1>{t("journey.heading")}</h1>
    </main>
  );
}
