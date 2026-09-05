import { Title } from "@solidjs/meta";
import { useI18n } from "~/shared/i18n";

/**
 * The home route, in the language its address named.
 *
 * @returns the landing page of the portfolio
 */
export default function Home() {
  const { t } = useI18n();
  return (
    <main>
      <Title>{t("home.title")}</Title>
      <h1>{t("home.heading")}</h1>
    </main>
  );
}
