import { describe, expect, it } from "vitest";
import { MetaProvider } from "@solidjs/meta";
import { cleanup, render } from "@solidjs/testing-library";
import NotFoundPage from "~/features/not-found/NotFoundPage";

/*
 * Aucun fournisseur de langue, et c'est tout le sujet : cet ecran est aussi la
 * route de tete, atteinte sur /de/x ou /nimportequoi, hors de la mise en page
 * qui porte le fournisseur. Un appel a `useI18n` y leverait — le rendu qui suit
 * est donc lui-meme l'assertion « elle ne leve pas », et l'erreur remontee
 * nommerait la cause.
 */
function withoutLanguage() {
  return render(() => (
    <MetaProvider>
      <NotFoundPage />
    </MetaProvider>
  ));
}

describe("la page introuvable hors de toute langue publiée", () => {
  it("ne suppose pas la langue du visiteur : elle propose les deux", () => {
    const { container } = withoutLanguage();
    const targets = [...container.querySelectorAll("a[href]")].map((node) => node.getAttribute("href"));

    expect(targets).toContain("/fr");
    expect(targets).toContain("/en");
    cleanup();
  });
});
