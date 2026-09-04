import { createSignal } from "solid-js";
import "./Counter.css";

/**
 * A counter button demonstrating local signal state.
 *
 * @returns a button whose label carries the number of clicks received
 */
export default function Counter() {
  const [count, setCount] = createSignal(0);
  return (
    <button class="increment" onClick={() => setCount(count() + 1)} type="button">
      Clicks: {count()}
    </button>
  );
}
