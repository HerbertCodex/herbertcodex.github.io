import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { LOCALES, type Locale } from "../../src/shared/i18n";
import { resumeOf } from "../../src/shared/resume";

const ADDRESS: Readonly<Record<Locale, string>> = { fr: "/fr/parcours", en: "/en/about" };

test.describe("le CV de la page parcours", () => {
  for (const locale of LOCALES) {
    test(`en ${locale}, le lien du CV n'est là que si le fichier de la langue existe dans le dépôt`, async ({
      page,
    }) => {
      await page.goto(ADDRESS[locale]);
      await expect(page.getByRole("main"), "la page parcours ne rend pas son parcours").toContainText(
        "Compagnie Ivoirienne d'Électricité",
      );

      const link = page.locator('main a[href^="/cv/"]');
      const published = resumeOf(locale);

      if (published === undefined) {
        await expect(link, `aucun CV ${locale} dans le dépôt, et pourtant un lien`).toHaveCount(0);
        return;
      }

      expect(existsSync(published.file), `${published.file} annoncé et absent du dépôt`).toBe(true);
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("href", published.href);
      const served = await page.request.get(published.href);
      expect(served.status(), `${published.href} ne répond pas`).toBe(200);
    });
  }
});
