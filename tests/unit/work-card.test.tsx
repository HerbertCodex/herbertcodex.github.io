import { describe, expect, it } from "vitest";
import { cleanup, render } from "@solidjs/testing-library";
import { createI18n, I18nContext, LOCALES, type Locale } from "~/shared/i18n";
import { contentFor, type Work } from "~/shared/content";
import WorkCard, { routeSheetOf } from "~/features/works/WorkCard";

function alone(work: Work, locale: Locale = "fr") {
  return render(() => (
    <I18nContext.Provider value={createI18n(() => locale)}>
      <WorkCard work={work} />
    </I18nContext.Provider>
  ));
}

const routeOf = (packet: Element) => packet.getAttribute("data-route");

describe("une réalisation prise seule", () => {
  it("s'affiche sans schéma ni image sans rompre la mise en page", () => {
    const [drawn] = contentFor("fr").works;
    const bare: Work = { ...drawn, diagram: undefined };

    const withSchema = alone(drawn);
    expect(withSchema.container.querySelector("figure svg")).not.toBeNull();
    withSchema.unmount();

    const { container, getByRole, getByText } = alone(bare);

    expect(container.querySelector("figure")).toBeNull();
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(getByRole("heading", { level: 2 }).textContent).toBe(bare.title);
    expect(getByText(bare.problem)).toBeTruthy();
    expect(getByText(bare.did)).toBeTruthy();

    const card = getByRole("article");
    const hollow = [...card.children].filter((child) => (child.textContent ?? "").trim().length === 0);
    expect(hollow).toEqual([]);
    cleanup();
  });

  it("fait circuler chaque point sur le trajet de son arête de flux, sans attribut style, dans chaque langue", () => {
    for (const locale of LOCALES) {
      for (const work of contentFor(locale).works.filter((each) => each.diagram !== undefined)) {
        const { container, unmount } = alone(work, locale);
        const strokes = [...container.querySelectorAll("path.edge")].map((stroke) => stroke.getAttribute("d"));
        const packets = [...container.querySelectorAll(".packet")];
        const label = `${locale} ${work.title}`;

        expect(packets.length, label).toBeGreaterThan(0);
        expect(
          packets.map((packet) => packet.getAttribute("style")),
          label,
        ).toEqual(packets.map(() => null));
        expect(packets.map(routeOf), label).toEqual(strokes);
        unmount();
      }
    }
  });

  it("ne fait circuler aucun point et n'écrit aucune règle pour une arête de flux qui désigne une boîte absente", () => {
    const drawn = contentFor("fr").works.find((work) => work.diagram !== undefined);
    if (drawn?.diagram === undefined) throw new Error("aucune réalisation du contenu ne porte de schéma");
    const [anchor] = drawn.diagram.nodes;
    const broken: Work = {
      ...drawn,
      diagram: {
        ...drawn.diagram,
        edges: [
          ...drawn.diagram.edges,
          { from: anchor.id, to: "absente", kind: "flow" },
          { from: "absente", to: anchor.id, kind: "flow" },
        ],
      },
    };

    const whole = alone(drawn);
    const intact = [...whole.container.querySelectorAll(".packet")].map(routeOf);
    whole.unmount();

    const { container } = alone(broken);
    const packets = [...container.querySelectorAll(".packet")];
    const sheet = routeSheetOf([broken]);
    const selectors = sheet
      .split("}")
      .filter((rule) => rule.trim() !== "")
      .map((rule) => rule.split("{")[0].trim());

    expect(packets.map(routeOf)).toEqual(intact);
    expect(container.querySelectorAll("path.edge")).toHaveLength(intact.length);
    expect(sheet).toBe(routeSheetOf([drawn]));
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      expect(
        packets.some((packet) => packet.matches(selector)),
        selector,
      ).toBe(true);
    }
    for (const packet of packets) {
      expect(selectors.filter((selector) => packet.matches(selector))).toHaveLength(1);
    }
    cleanup();
  });
});
