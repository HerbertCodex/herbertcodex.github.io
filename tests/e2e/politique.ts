import type { Page } from "@playwright/test";

const POLICY_MESSAGE = /Content Security Policy/i;

type PolicyReport = {
  readonly violations: readonly string[];
  readonly messages: readonly string[];
};

type Reporting = { reportPolicyViolation(violation: string): void };

/**
 * Listens, from before the first script of every document the page loads, to all the content policy reports.
 *
 * The listening is attached to the page rather than to a document, so it
 * survives navigations and reloads: a violation during hydration is heard,
 * and a violation on a page left since is not forgotten.
 *
 * @param page - the page to watch, before it navigates anywhere
 * @returns a reading of what the policy reported so far: its securitypolicyviolation events, and the console messages naming it
 */
export async function collectPolicyReports(page: Page): Promise<() => Promise<PolicyReport>> {
  const violations: string[] = [];
  const messages: string[] = [];
  page.on("console", (message) => {
    if (POLICY_MESSAGE.test(message.text())) messages.push(`${message.type()} : ${message.text()}`);
  });
  await page.exposeFunction("reportPolicyViolation", (violation: string) => violations.push(violation));
  await page.addInitScript(() => {
    addEventListener(
      "securitypolicyviolation",
      (event) => {
        const blocked = event.blockedURI === "" ? "inline" : event.blockedURI;
        (window as unknown as Reporting).reportPolicyViolation(
          `${event.documentURI} : ${event.effectiveDirective} refuse ${blocked}`,
        );
      },
      { capture: true },
    );
  });
  return async () => {
    await page.evaluate(() => new Promise((settled) => setTimeout(settled, 0)));
    return { violations: [...violations], messages: [...messages] };
  };
}
