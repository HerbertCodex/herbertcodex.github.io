import { Title } from "@solidjs/meta";
import { For } from "solid-js";
import ContactLinks, { CONTACT_EMAIL } from "./ContactLinks";
import { useI18n } from "~/shared/i18n";
import "./ContactPage.css";

const TERMS = ["contract", "place", "start"] as const;

/**
 * The page saying how to get in touch, and under which conditions.
 *
 * @returns the contact page, in the language in force
 */
export default function ContactPage() {
  const { t } = useI18n();
  return (
    <main>
      <Title>{t("contact.title")}</Title>
      <h1>{t("contact.heading")}</h1>
      <section class="card">
        <div class="reach">
          <span class="status">{t("contact.lede")}</span>
          <span class="reach-what">{t("contact.write")}</span>
          <a class="reach-address" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          <ContactLinks />
        </div>
        <dl class="terms">
          <For each={TERMS}>
            {(term) => (
              <>
                <dt>{t(`contact.terms.${term}.label`)}</dt>
                <dd>{t(`contact.terms.${term}.value`)}</dd>
              </>
            )}
          </For>
        </dl>
      </section>
    </main>
  );
}
