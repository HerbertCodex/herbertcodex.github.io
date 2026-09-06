import { createSignal, onCleanup, onMount } from "solid-js";
import { useI18n } from "~/shared/i18n";
import { chooseTheme, readChoice, themeInForce, watchSystemTheme, type Theme } from "~/shared/theme";
import "./ThemeToggle.css";

/**
 * The button passing the portfolio from dark to light and back.
 *
 * The theme is read again on mount rather than trusted from the render: the
 * document is prerendered, so the HTML that reaches the browser was written
 * without knowing this reader. `public/theme.js` has already put the choice
 * on the document by then, and this catches the button up with it.
 *
 * The system is followed only while nothing has been chosen. After a choice,
 * a button following the system would announce a theme the page no longer
 * renders, since the tokens stop listening to the system at that point.
 *
 * @returns the toggle button, announcing the theme in force
 */
export default function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = createSignal<Theme>(themeInForce());

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
    <button class="theme" type="button" aria-pressed={theme() === "dark" ? "true" : "false"} onClick={toggle}>
      {t("bar.theme")}
    </button>
  );
}
