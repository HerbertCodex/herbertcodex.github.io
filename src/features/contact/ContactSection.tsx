import { For } from "solid-js";
import ContactLinks, { CONTACT_CALL } from "./ContactLinks";
import SectionHead from "~/shared/SectionHead";
import { useI18n } from "~/shared/i18n";
import "./ContactSection.css";

const TERMS = ["contract", "place", "start"] as const;

type ContactSectionProps = {
  readonly rank: number;
  readonly anchor: string;
};

/**
 * The section saying how to get in touch, and under which conditions.
 *
 * @param props - the rank this section carries in the page, and its anchor
 * @returns the contact section, in the language in force
 */
export default function ContactSection(props: ContactSectionProps) {
  const { t } = useI18n();
  return (
    <section class="contact" aria-labelledby={props.anchor}>
      <SectionHead rank={props.rank} name={t("contact.heading")} headingId={props.anchor} />
      <section class="card">
        <div class="reach">
          <span class="status">{t("contact.lede")}</span>
          <a class="reach-call" href={CONTACT_CALL.href}>
            {t("contact.call")}
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
    </section>
  );
}
