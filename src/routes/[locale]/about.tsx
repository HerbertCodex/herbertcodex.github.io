import { Title } from "@solidjs/meta";
import { useI18n } from "~/shared/i18n";

/**
 * The about route, in the language its address named.
 *
 * @returns the page presenting who the portfolio belongs to
 */
export default function About() {
  const { t } = useI18n();
  return (
    <main>
      <Title>{t("about.title")}</Title>
      <h1>{t("about.heading")}</h1>
    </main>
  );
}
