/**
 * A theme the portfolio can be read in.
 */
export type Theme = "light" | "dark";

/**
 * The name the reader's choice is kept under, on their own machine.
 *
 * `public/theme.js` reads this same name before the first paint, and it
 * cannot import it: it is served as it is written, outside the bundle. The
 * two copies are held together by the browser suite, which stores the choice
 * through this module and reads it back through that file.
 */
export const THEME_KEY = "portfolio-theme";

const THEME_ATTRIBUTE = "data-theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * The theme the reader chose, or nothing when they have not chosen.
 *
 * Anything the product did not write is read as an absence of choice rather
 * than as an error: the value belongs to the reader's machine, where an
 * extension, an older version or another site's collision can leave what it
 * likes. Storage refused altogether answers the same way.
 *
 * @returns the theme in store, or null when there is no usable choice
 */
export function readChoice(): Theme | null {
  try {
    const stored = globalThis.localStorage?.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return globalThis.matchMedia?.(DARK_QUERY).matches === true ? "dark" : "light";
}

/**
 * The theme in force: the reader's choice, or their system while they have not chosen.
 *
 * @returns the theme the page must be read in
 */
export function themeInForce(): Theme {
  return readChoice() ?? systemTheme();
}

/**
 * Records the reader's choice and puts it on the document at once.
 *
 * The attribute is set even when the store refuses, so the choice holds for
 * the page being read rather than not at all.
 *
 * @param theme - the theme the reader asked for
 */
export function chooseTheme(theme: Theme): void {
  try {
    globalThis.localStorage?.setItem(THEME_KEY, theme);
  } catch {
    /* Un navigateur qui refuse le stockage ne doit pas empêcher le basculement. */
  }
  globalThis.document?.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
}

/**
 * Follows a change of the system theme while the page stays open.
 *
 * @param onChange - called with the theme the system now asks for
 * @returns the function that stops following
 */
export function watchSystemTheme(onChange: (theme: Theme) => void): () => void {
  const query = globalThis.matchMedia?.(DARK_QUERY);
  if (query == null) return () => undefined;
  const listener = (event: MediaQueryListEvent) => onChange(event.matches ? "dark" : "light");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
