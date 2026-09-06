import { Title } from "@solidjs/meta";
import { useI18n } from "~/shared/i18n";

/**
 * The page saying how to get in touch. Its content belongs to i-hxac.
 *
 * @returns the contact page, in the language in force
 */
export default function ContactPage() {
  const { t } = useI18n();
  return (
    <main>
      <Title>{t("contact.title")}</Title>
      <h1>{t("contact.heading")}</h1>
    </main>
  );
}
