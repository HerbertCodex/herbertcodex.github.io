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
 * It closes the page on a full plate, as the reference mockup draws it. The
 * mockup calls that block `.panel`; the class here stays `.contact`, which
 * names what the section IS rather than how it is painted, and which the
 * browser suite already selects.
 *
 * @param props - the rank this section carries in the page, and its anchor
 * @returns the contact section, in the language in force
 */
export default function ContactSection(props: ContactSectionProps) {
  const { t } = useI18n();
  return (
    <section class="contact" aria-labelledby={props.anchor}>
      <SectionHead rank={props.rank} name={t("contact.heading")} headingId={props.anchor} />
      <p class="panel-title">{t("contact.lede")}</p>
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
      <ul class="links">
        <li>
          <a href={CONTACT_CALL.href}>{t("contact.call")}</a>
        </li>
        <ContactLinks />
      </ul>
    </section>
  );
}
