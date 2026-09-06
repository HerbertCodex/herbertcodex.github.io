import HomePage from "~/shared/HomePage";

/**
 * The home route, which the common route never serves: the language prefix
 * alone carries no page name for it to match.
 *
 * @returns the opening of the portfolio, in the language its address named
 */
export default function Home() {
  return <HomePage />;
}
