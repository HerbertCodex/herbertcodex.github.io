import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { PRERENDERED } from "../../scripts/routes.mjs";
import { collectPolicyReports } from "./politique";

/*
 * Les cinq en-têtes que le serveur de la CI pose et que GitHub Pages n'envoie
 * pas, en minuscules : c'est la forme sous laquelle Playwright rend les noms.
 */
const SECURITY_HEADERS = [
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
];

const POLICY_TAG = /<meta http-equiv="Content-Security-Policy"[^>]*>/;

/* Un nom que le site n'emploie nulle part : s'il est posé, c'est par le script inséré. */
const INTRUDER = "intrusDuSiteNu";

const WORKS = ["/fr", "/en"];

function securityHeadersIn(headers: Record<string, string>): string[] {
  return SECURITY_HEADERS.filter((name) => name in headers);
}

/*
 * Le serveur de la CI n'a pas d'interrupteur, et c'est voulu : les en-têtes
 * sont retirés dans le navigateur, sur chaque réponse, comme Pages sert.
 * La réécriture ne touche que les documents, jamais leurs ressources.
 */
async function serveBare(context: BrowserContext, rewrite?: (html: string) => string): Promise<void> {
  await context.route("**/*", async (route) => {
    const response = await route.fetch();
    const headers = Object.fromEntries(
      Object.entries(response.headers()).filter(([name]) => !SECURITY_HEADERS.includes(name)),
    );
    if (rewrite === undefined || !route.request().isNavigationRequest()) {
      await route.fulfill({ response, headers });
      return;
    }
    await route.fulfill({ response, headers, body: rewrite(await response.text()) });
  });
}

async function visitEveryAddress(page: Page): Promise<void> {
  for (const address of PRERENDERED) {
    await page.goto(address);
    await page.waitForLoadState("networkidle");
  }
}

test("servies sans aucun en-tête, les dix adresses n'émettent aucune violation ni aucun message de la politique", async ({
  context,
  page,
}) => {
  await serveBare(context);
  const reports = await collectPolicyReports(page);

  await visitEveryAddress(page);

  expect(PRERENDERED).toHaveLength(10);
  expect(await reports()).toEqual({ violations: [], messages: [] });
});

test("servi sans en-tête, le site s'hydrate : le bouton de thème change le thème du document, et le choix survit au rechargement", async ({
  context,
  page,
}) => {
  await serveBare(context);
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/en");
  const theme = () => page.locator("html").getAttribute("data-theme");
  const system = await theme();

  await page.locator("header button").click();
  await expect.poll(theme, "le clic n'a pas changé le thème : la page ne s'est pas hydratée").not.toBe(system);
  const chosen = await theme();
  await page.reload();

  expect(await theme()).toBe(chosen);
});

for (const address of WORKS) {
  test(`servi sans en-tête, sur ${address}, chaque point suit un trajet calculé, sans violation de style-src`, async ({
    context,
    page,
  }) => {
    await serveBare(context);
    const reports = await collectPolicyReports(page);
    await page.goto(address);
    await page.waitForLoadState("networkidle");

    const routes = await page
      .locator("main .packet")
      .evaluateAll((packets) => packets.map((packet) => getComputedStyle(packet).offsetPath));
    const { violations } = await reports();

    expect(routes.length).toBeGreaterThan(0);
    expect(routes.filter((route) => !route.startsWith("path("))).toEqual([]);
    expect(violations.filter((violation) => violation.includes(" : style-src"))).toEqual([]);
  });
}

test("servi sans en-tête, un script inline étranger au build, inséré après la balise de politique, ne s'exécute pas et est rapporté", async ({
  context,
  page,
}) => {
  let inserted = false;
  await serveBare(context, (html) => {
    inserted = POLICY_TAG.test(html);
    return html.replace(POLICY_TAG, (tag) => `${tag}<script>window.${INTRUDER} = true;</script>`);
  });
  const reports = await collectPolicyReports(page);
  await page.goto("/fr");
  await page.waitForLoadState("networkidle");

  const set = await page.evaluate((name) => typeof (window as unknown as Record<string, unknown>)[name], INTRUDER);
  const { violations } = await reports();

  expect(inserted, "la page servie ne porte pas la balise de politique : rien n'a été inséré").toBe(true);
  expect(set, `le script inséré a posé window.${INTRUDER}`).toBe("undefined");
  expect(violations).toEqual([expect.stringMatching(/\/fr : script-src(-elem)? refuse inline$/)]);
});

test("contrôle du banc : ce que l'interception livre à la page ne porte aucun des cinq en-têtes, que la même adresse porte servie sans elle", async ({
  context,
  page,
  request,
}) => {
  await serveBare(context);
  const received: Promise<string[]>[] = [];
  page.on("response", (response) => received.push(response.allHeaders().then(securityHeadersIn)));

  await visitEveryAddress(page);
  const direct = await Promise.all(
    PRERENDERED.map(async (address) => securityHeadersIn((await request.get(address)).headers())),
  );

  expect(received.length).toBeGreaterThanOrEqual(PRERENDERED.length);
  expect((await Promise.all(received)).flat()).toEqual([]);
  expect(direct).toEqual(PRERENDERED.map(() => SECURITY_HEADERS));
});
