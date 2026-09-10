import { Title } from "@solidjs/meta";
import ContactSection from "~/features/contact/ContactSection";
import Opening from "~/features/home/Opening";
import JourneySection, { journeyHeadCount } from "~/features/journey/JourneySection";
import WorksSection from "~/features/works/WorksSection";
import { contentFor } from "~/shared/content";
import { useI18n } from "~/shared/i18n";
import { PERSON } from "~/shared/identity";
import { NAMED_PAGES, SECTIONS, anchorOf } from "~/shared/pages";

/**
 * The page, and the only one the site publishes in each language.
 *
 * It was four pages until 2026-09-10. The approved mockup draws one document
 * that opens on the name and scrolls through the work, the journey and the way
 * to get in touch; its own menu pointed at four addresses, and the site had
 * followed the menu rather than the document. The operator settled it for the
 * document.
 *
 * The composition lives HERE rather than in a feature because a feature may
 * only reach `shared` — the architecture gate refuses one feature importing
 * another, and assembling the page is exactly the work of a route.
 *
 * The numbering is computed rather than written: the journey draws three
 * sections or four depending on whether a certification exists, so the rank of
 * the contact section cannot be fixed in advance.
 *
 * @returns the single page, in the language in force
 */
export default function SinglePage() {
  const { locale, t } = useI18n();
  /*
   * L'ancre de chaque section, prise dans la table qui les declare. Celle du
   * PARCOURS est prise dans l'autre table : elle nomme le groupe des trois
   * sections du parcours, et elle existe pour que /fr/parcours — une adresse
   * partagee avant le 2026-09-10 — conduise encore quelque part.
   */
  const anchorFor = (key: string) => {
    const section = SECTIONS.find((one) => one.key === key);
    return section === undefined ? "" : section.slugs[locale()];
  };
  const journeyAnchor = () => {
    const journey = NAMED_PAGES.find((page) => page.key === "journey");
    return journey === undefined ? "" : anchorOf(journey, locale());
  };
  const after = () => 2 + journeyHeadCount(contentFor(locale()).journey);

  return (
    <main>
      {/*
        Le titre de l'onglet nomme la personne et ce qu'elle fait, plutot que la
        page : il n'y a plus qu'une page, et « Accueil » ne disait rien a qui
        retrouve l'onglet parmi dix autres. Il est COMPOSE des deux sources qui
        existent deja — le nom vit dans identity.ts, le role dans les
        dictionnaires — pour ne pas ecrire le nom une troisieme fois.
      */}
      <Title>{`${PERSON} — ${t("home.heading")}`}</Title>
      <Opening />
      <WorksSection rank={1} anchor={anchorFor("works")} />
      <JourneySection
        from={2}
        anchor={journeyAnchor()}
        anchors={{
          experience: anchorFor("experience"),
          education: anchorFor("education"),
          skills: anchorFor("skills"),
        }}
      />
      <ContactSection rank={after()} anchor={anchorFor("contact")} />
    </main>
  );
}
