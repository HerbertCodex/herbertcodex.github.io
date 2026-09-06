import { describe, expect, it } from "vitest";
import { cleanup, render } from "@solidjs/testing-library";
import { createI18n, I18nContext } from "~/shared/i18n";
import { contentFor, type Work } from "~/shared/content";
import WorkCard from "~/shared/WorkCard";

function alone(work: Work) {
  return render(() => (
    <I18nContext.Provider value={createI18n(() => "fr")}>
      <WorkCard work={work} />
    </I18nContext.Provider>
  ));
}

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
});
