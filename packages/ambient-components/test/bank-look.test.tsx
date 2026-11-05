import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AmbientKitProvider, AmbientSelect } from "../src";
import type { ControlKit } from "../src";

/* The bank's glow is a kit's choice, not the bank's. `.amb-select` is the
   rail alone; the lamp floor and the glow are separate classes a kit opts
   into — the grounded kit does, a kit that draws its own keys need not. */

const OPTIONS = [{ value: "1" }, { value: "2" }];

describe("bank look layers", () => {
  it("the grounded bank opts into the rail, the lamp floor and the glow", () => {
    render(<AmbientSelect aria-label="bank" options={OPTIONS} defaultValue="1" />);
    const root = screen.getByRole("radiogroup");
    for (const name of ["amb-select", "amb-select-lamp", "amb-select-glow"]) {
      expect(root.className).toContain(name);
    }
  });

  it("a kit that seats its own keys in the rail carries no glow", () => {
    const kit: ControlKit = {
      name: "plain",
      bank: () => ({ className: "amb-select", parts: { actuator: <span className="key-face" /> } })
    };
    render(
      <AmbientKitProvider kit={kit}>
        <AmbientSelect aria-label="bank" options={OPTIONS} defaultValue="1" />
      </AmbientKitProvider>
    );
    const root = screen.getByRole("radiogroup");
    expect(root.className).toContain("amb-select");
    expect(root.className).not.toContain("amb-select-glow");
    expect(root.className).not.toContain("amb-select-lamp");
  });
});
