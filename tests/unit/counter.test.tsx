import { describe, expect, it } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import Counter from "~/components/Counter";

describe("Counter", () => {
  it("starts at zero", () => {
    const { getByRole } = render(() => <Counter />);
    expect(getByRole("button").textContent).toContain("0");
    cleanup();
  });

  it("counts one click", async () => {
    const { getByRole } = render(() => <Counter />);
    const button = getByRole("button");
    await fireEvent.click(button);
    expect(button.textContent).toContain("1");
    cleanup();
  });

  it("keeps counting across clicks", async () => {
    const { getByRole } = render(() => <Counter />);
    const button = getByRole("button");
    await fireEvent.click(button);
    await fireEvent.click(button);
    await fireEvent.click(button);
    expect(button.textContent).toContain("3");
    cleanup();
  });
});
