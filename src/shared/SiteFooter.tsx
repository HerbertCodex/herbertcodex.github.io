import { useI18n } from "~/shared/i18n";
import "./SiteFooter.css";

const NAME = "Donatien Koffi";

/**
 * The signature the foot of the page carries.
 *
 * The moment is a parameter rather than read inside: a function reading the
 * clock itself can only be tested by moving the clock, and a year written in
 * the code would have to be remembered every January.
 *
 * @param now - the moment the page is rendered at
 * @returns the person, then the year that moment falls in
 */
export function signatureAt(now: Date): string {
  return `${NAME}, ${now.getFullYear()}`;
}

/**
 * The foot every page carries: who the site is, since when, and from where.
 *
 * @returns the footer landmark, named in the language in force
 */
export default function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer class="foot" aria-label={t("footer.label")}>
      <span>{signatureAt(new Date())}</span>
      <span>{t("footer.place")}</span>
    </footer>
  );
}
