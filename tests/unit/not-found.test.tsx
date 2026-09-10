import { describe, expect, it } from "vitest";
import { MetaProvider } from "@solidjs/meta";
import { cleanup, render } from "@solidjs/testing-library";
import { createI18n, DICTIONARIES, I18nContext, type Locale } from "~/shared/i18n";
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

/*
 * Et l'autre moitie des points d'entree : /fr/inconnu passe par le repli de la
 * route commune, DANS la mise en page qui porte le fournisseur. Une seule
 * langue est alors en force, et le document la declare lui-meme.
 */
function underLanguage(locale: Locale) {
  return render(() => (
    <MetaProvider>
      <I18nContext.Provider value={createI18n(() => locale)}>
        <NotFoundPage />
      </I18nContext.Provider>
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

  /*
   * Le document ne peut declarer qu'une langue, et cet ecran est le seul a en
   * dire deux. Sans `lang` sur chaque moitie, un lecteur d'ecran annonce les
   * deux avec la voix que le document declare : les mots anglais lus par une
   * voix francaise, ou l'inverse. L'attribut est ce qui lui permet de changer.
   */
  it("donne son attribut lang à chaque moitié, puisque le document n'en déclare qu'une", () => {
    const { container } = withoutLanguage();
    const heading = container.querySelector("h1");
    const lede = container.querySelector("p");

    for (const [node, line] of [
      [heading, "heading"],
      [lede, "lede"],
    ] as const) {
      const halves = [...(node?.querySelectorAll("[lang]") ?? [])];

      expect(halves.map((half) => half.getAttribute("lang"))).toEqual(["fr", "en"]);
      expect(halves.map((half) => half.textContent)).toEqual([
        DICTIONARIES.fr.notFound[line],
        DICTIONARIES.en.notFound[line],
      ]);
    }
    cleanup();
  });

  it("nomme aussi la langue de chaque chemin de retour, les deux libellés étant côte à côte", () => {
    const { container } = withoutLanguage();
    const ways = [...container.querySelectorAll("a[href]")];

    expect(ways.map((way) => way.getAttribute("lang"))).toEqual(["fr", "en"]);
    cleanup();
  });
});

describe("la page introuvable sous un préfixe de langue publié", () => {
  /*
   * Le revers de l'assertion precedente : une seule langue est en force, le
   * document la declare, et un `lang` de plus ne dirait rien. L'attribut
   * marque un CHANGEMENT de langue ; pose partout il cesse d'en marquer un.
   */
  it("ne répète pas sur chaque ligne la langue que le document déclare déjà", () => {
    for (const locale of ["fr", "en"] as const) {
      const { container } = underLanguage(locale);

      expect(container.querySelectorAll("[lang]").length).toBe(0);
      cleanup();
    }
  });
});
