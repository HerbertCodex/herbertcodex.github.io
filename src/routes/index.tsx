import { Title } from "@solidjs/meta";
import Counter from "~/components/Counter";
import StarterNote from "~/shared/StarterNote";

/**
 * The home route.
 *
 * @returns the landing page of the portfolio
 */
export default function Home() {
  return (
    <main>
      <Title>Hello World</Title>
      <h1>Hello world!</h1>
      <Counter />
      <StarterNote />
    </main>
  );
}
