import { describe, expect, it } from "vitest";
import { MetaProvider } from "@solidjs/meta";
import { render, cleanup, within } from "@solidjs/testing-library";
import JourneyPage from "~/shared/JourneyPage";
import { contentFor, type Journey } from "~/shared/content";
import { createI18n, I18nContext, type Locale } from "~/shared/i18n";

const FRENCH = createI18n(() => "fr");

function shown(locale: Locale, journey?: Journey) {
  return render(() => (
    <MetaProvider>
      <I18nContext.Provider value={createI18n(() => locale)}>
        <JourneyPage journey={journey} />
      </I18nContext.Provider>
    </MetaProvider>
  ));
}

function section(screen: ReturnType<typeof shown>, name: string) {
  return screen.getByRole("region", { name });
}

function months(period: { readonly start: string; readonly end: string | null }): string {
  const asMonth = (value: string) => `${value.slice(5, 7)}/${value.slice(0, 4)}`;
  const end = period.end === null ? FRENCH.t("journey.present") : asMonth(period.end);
  return `${asMonth(period.start)}–${end}`;
}

function tagsUnder(heading: HTMLElement): string[] {
  const block = heading.parentElement;
  expect(block, "un titre de groupe sans bloc").not.toBeNull();
  return [...(block as HTMLElement).querySelectorAll("span")].map((tag) => tag.textContent ?? "");
}

describe("la page parcours", () => {
  it("nomme sur chaque ligne d'expérience l'employeur exact, la période exacte, le rôle et ce qui y a été fait", () => {
    const journey = contentFor("fr").journey;
    const screen = shown("fr");
    const rows = within(section(screen, FRENCH.t("journey.sections.experience"))).getAllByRole("listitem");

    expect(rows).toHaveLength(journey.experiences.length);
    journey.experiences.forEach((experience, rank) => {
      const said = rows[rank].textContent ?? "";
      expect(said, `employeur de ${experience.id}`).toContain(experience.employer);
      expect(said, `période de ${experience.id}`).toContain(months(experience.period));
      expect(said, `rôle de ${experience.id}`).toContain(experience.role);
      expect(said, `ce qui a été fait chez ${experience.id}`).toContain(experience.summary);
    });

    const electricity = journey.experiences.filter((row) => row.id === "cie")[0];
    expect(electricity.employer).toBe("Compagnie Ivoirienne d'Électricité");
    expect(screen.container.textContent).toContain("Compagnie Ivoirienne d'Électricité");
    expect(screen.container.textContent, "une abréviation désignant aucune entreprise réelle").not.toMatch(/\bCIE\b/);
    cleanup();
  });

  it("distingue le poste en cours autrement que par sa place dans la liste", () => {
    const base = contentFor("fr").journey;
    const rank = 2;
    const experiences = base.experiences.map((row, at) =>
      at === rank ? { ...row, period: { start: row.period.start, end: null } } : row,
    );
    const screen = shown("fr", { ...base, experiences });
    const rows = within(section(screen, FRENCH.t("journey.sections.experience"))).getAllByRole("listitem");
    const mark = FRENCH.t("journey.current");

    const marked = rows.filter((row) => (row.textContent ?? "").includes(mark));
    expect(marked, "le poste en cours n'est signalé nulle part").toHaveLength(1);
    expect(rows.indexOf(marked[0]), "le poste en cours n'est pas celui qui dure encore").toBe(rank);
    expect(marked[0].textContent).toContain(months(experiences[rank].period));
    cleanup();
  });

  it("nomme sur chaque diplôme son intitulé, son établissement et son année", () => {
    const journey = contentFor("fr").journey;
    const screen = shown("fr");
    const rows = within(section(screen, FRENCH.t("journey.sections.education"))).getAllByRole("listitem");

    expect(rows).toHaveLength(journey.education.length);
    journey.education.forEach((diploma, rank) => {
      const said = rows[rank].textContent ?? "";
      expect(said, `intitulé de ${diploma.id}`).toContain(diploma.degree);
      expect(said, `établissement de ${diploma.id}`).toContain(diploma.institution);
      expect(said, `année de ${diploma.id}`).toContain(diploma.year);
    });
    cleanup();
  });

  it("dit d'un diplôme en cours d'obtention qu'il l'est, et ne le dit pas des autres", () => {
    const base = contentFor("fr").journey;
    const obtained = base.education[0];
    const education = [{ ...obtained, id: "en-cours", ongoing: true }, obtained];
    const screen = shown("fr", { ...base, education });
    const rows = within(section(screen, FRENCH.t("journey.sections.education"))).getAllByRole("listitem");
    const mark = FRENCH.t("journey.ongoing");

    expect(rows[0].textContent, "un diplôme en cours d'obtention ne le dit pas").toContain(mark);
    expect(rows[1].textContent, "un diplôme obtenu est annoncé en cours").not.toContain(mark);
    cleanup();
  });

  it("ne rend rien de la partie certifications tant qu'aucune certification n'existe", () => {
    const journey = contentFor("fr").journey;
    expect(journey.certifications, "le dépôt publie déjà une certification").toHaveLength(0);

    const screen = shown("fr");
    const title = FRENCH.t("journey.sections.certifications");
    expect(screen.queryByRole("region", { name: title }), "un titre seul").toBeNull();
    expect(screen.queryByRole("heading", { name: title })).toBeNull();
    expect(screen.container.textContent ?? "").not.toContain(title);
    cleanup();
  });

  it("rend la partie certifications, avec organisme et objet, dès qu'une certification existe", () => {
    const base = contentFor("fr").journey;
    const certification = { id: "essai", body: "Un organisme", subject: "Un objet", obtainedAt: "2026" };
    const screen = shown("fr", { ...base, certifications: [certification] });
    const rows = within(section(screen, FRENCH.t("journey.sections.certifications"))).getAllByRole("listitem");

    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain(certification.body);
    expect(rows[0].textContent).toContain(certification.subject);
    expect(rows[0].textContent).toContain(certification.obtainedAt);
    cleanup();
  });

  it("présente les compétences en étiquettes groupées par domaine", () => {
    const journey = contentFor("fr").journey;
    const screen = shown("fr");
    const region = section(screen, FRENCH.t("journey.sections.skills"));

    for (const group of journey.skills) {
      const heading = within(region).getByRole("heading", { name: group.name });
      expect(tagsUnder(heading), `étiquettes du groupe ${group.id}`).toEqual([...group.skills]);
    }
    cleanup();
  });

  it("fait disparaître un groupe dont plus aucune compétence n'est adossée, au lieu d'un titre vide", () => {
    const base = contentFor("fr").journey;
    const emptied = base.skills[1];
    const skills = base.skills.map((group) => (group.id === emptied.id ? { ...group, skills: [] } : group));
    const screen = shown("fr", { ...base, skills });
    const region = section(screen, FRENCH.t("journey.sections.skills"));

    expect(within(region).queryByRole("heading", { name: emptied.name }), "un titre de groupe vide").toBeNull();
    expect(region.textContent ?? "").not.toContain(emptied.name);
    for (const group of skills.filter((one) => one.skills.length > 0)) {
      expect(within(region).getByRole("heading", { name: group.name })).toBeTruthy();
    }
    cleanup();
  });
});
