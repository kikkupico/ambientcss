import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AmbientKitProvider, AmbientSwitch } from "../src";
import type { ControlKit, KitLook } from "../src";

/* A kit may draw more than one version of a family. The preset's `variant`
   prop arrives as `look.variant`, and the family function branches on it. */

const seen: KitLook[] = [];

const kit: ControlKit = {
  name: "two-switches",
  latch: (look) => {
    seen.push(look);
    return look.variant === "toggle"
      ? { className: "toggle-root", parts: { base: <span data-testid="toggle-track" /> } }
      : { className: "pill-root", parts: { base: <span data-testid="pill-track" /> } };
  },
  looks: { latch: [] },
  variants: { latch: ["pill", "toggle"] }
};

afterEach(() => {
  cleanup();
  seen.length = 0;
  vi.restoreAllMocks();
});

describe("kit variants", () => {
  it("hands the preset's variant to the kit as look.variant", () => {
    render(
      <AmbientKitProvider kit={kit}>
        <AmbientSwitch aria-label="a" />
        <AmbientSwitch aria-label="b" variant="toggle" />
      </AmbientKitProvider>
    );
    expect(screen.getByLabelText("a").className).toContain("pill-root");
    expect(screen.getByLabelText("b").className).toContain("toggle-root");
    expect(screen.getByTestId("toggle-track")).toBeTruthy();
    expect(seen.map((look) => look.variant)).toEqual([undefined, "toggle"]);
  });

  it("does not report variant as another kit's vocabulary", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <AmbientKitProvider kit={kit}>
        <AmbientSwitch aria-label="b" variant="toggle" />
      </AmbientKitProvider>
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once about a variant the kit does not offer", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <AmbientKitProvider kit={kit}>
        <AmbientSwitch aria-label="c" variant="rocker" />
        <AmbientSwitch aria-label="d" variant="rocker" />
      </AmbientKitProvider>
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('no latch variant "rocker"');
    expect(screen.getByLabelText("c").className).toContain("pill-root");
  });
});
