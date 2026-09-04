import { describe, expect, it } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import StarterNote from "~/shared/StarterNote";

describe("StarterNote", () => {
  it("links to the framework documentation", () => {
    const { getByRole } = render(() => <StarterNote />);
    const link = getByRole("link");
    expect(link.getAttribute("href")).toBe("https://start.solidjs.com");
    cleanup();
  });

  it("opens the link safely in a new tab", () => {
    const { getByRole } = render(() => <StarterNote />);
    const link = getByRole("link");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
    cleanup();
  });
});
