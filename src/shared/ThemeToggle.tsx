import { Moon, Sun } from "lucide-solid";
import { createSignal, onCleanup, onMount } from "solid-js";
import { useI18n } from "~/shared/i18n";
import { chooseTheme, PRERENDERED_THEME, readChoice, themeInForce, watchSystemTheme, type Theme } from "~/shared/theme";
import "./ThemeToggle.css";

/**
 * The button passing the portfolio from dark to light and back.
 *
 * It renders from `PRERENDERED_THEME` and only reaches the theme in force on
 * mount. Hydration adopts the server's markup without rewriting it, so the
 * announcement is corrected by a change of value, never by the first render:
 * a button created on what it can already read would agree with itself while
 * contradicting the attribute the server left in the page.
 *
 * The system is followed only while nothing has been chosen. After a choice,
 * a button following the system would announce a theme the page no longer
 * renders, since the tokens stop listening to the system at that point.
 *
 * The icon shows what activating offers rather than what is in force, which
 * is what the word it replaces did: a crescent while the page is light. What
 * is in force stays on `aria-pressed`, where a technology can read it, and
 * the name stays a word of the page's own language rather than a drawing.
 *
 * @returns the toggle button, announcing the theme in force
 */
export default function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = createSignal<Theme>(PRERENDERED_THEME);

  onMount(() => {
    setTheme(themeInForce());
    onCleanup(
      watchSystemTheme((system) => {
        if (readChoice() === null) setTheme(system);
      }),
    );
  });

  const toggle = () => {
    const next: Theme = theme() === "dark" ? "light" : "dark";
    chooseTheme(next);
    setTheme(next);
  };

  return (
    <button
      class="theme"
      type="button"
      aria-pressed={theme() === "dark" ? "true" : "false"}
      aria-label={t("bar.theme")}
      onClick={toggle}
    >
      {theme() === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}
