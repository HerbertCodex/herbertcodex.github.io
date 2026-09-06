import { describe, expect, it } from "vitest";
import { readChoice, THEME_KEY } from "~/shared/theme";

describe("le choix de thème enregistré sur le poste du lecteur", () => {
  it("vaut absence de choix quand ce n'est pas une valeur que le produit écrit", () => {
    localStorage.setItem(THEME_KEY, "aubergine");

    expect(readChoice()).toBeNull();
  });
});
