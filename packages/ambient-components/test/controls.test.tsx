import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import { useState } from "react";
import {
  AmbientRotary,
  AmbientTravel,
  AmbientPress,
  AmbientLatch,
  AmbientBank
} from "../src";

/* The bare mechanisms. They have no appearance, so what can be tested is
   the contract: ARIA, the state channel (data attributes and custom
   properties), keyboard interaction and the value callbacks. */

describe("AmbientRotary", () => {
  it("exposes a slider role with its range", () => {
    render(<AmbientRotary aria-label="gain" min={0} max={10} defaultValue={3} />);
    const el = screen.getByRole("slider");
    expect(el.getAttribute("aria-valuemin")).toBe("0");
    expect(el.getAttribute("aria-valuemax")).toBe("10");
    expect(el.getAttribute("aria-valuenow")).toBe("3");
    expect(el.className).toContain("ambx-rotary");
  });

  it("moves by arrow keys and honours step", async () => {
    const onChange = vi.fn();
    render(<AmbientRotary aria-label="gain" defaultValue={50} step={5} onChange={onChange} />);
    const el = screen.getByRole("slider");
    await userEvent.tab();
    await userEvent.keyboard("{ArrowUp}");
    expect(el.getAttribute("aria-valuenow")).toBe("55");
    await userEvent.keyboard("{PageDown}");
    // 55 - 50 snaps to the grid anchored at min=0.
    expect(el.getAttribute("aria-valuenow")).toBe("5");
    expect(onChange).toHaveBeenCalled();
  });

  it("clamps at its ends and publishes data-at-min / data-at-max", async () => {
    render(<AmbientRotary aria-label="gain" min={0} max={10} defaultValue={0} />);
    const el = screen.getByRole("slider");
    expect(el.hasAttribute("data-at-min")).toBe(true);
    await userEvent.tab();
    await userEvent.keyboard("{End}");
    expect(el.getAttribute("aria-valuenow")).toBe("10");
    expect(el.hasAttribute("data-at-max")).toBe(true);
    expect(el.hasAttribute("data-at-min")).toBe(false);
  });

  it("publishes the state channel as custom properties", () => {
    render(<AmbientRotary aria-label="gain" min={0} max={4} defaultValue={1} travel={270} />);
    const el = screen.getByRole("slider") as HTMLElement;
    // percent 0.25 of a 270deg sweep from -135deg -> -67.5deg.
    expect(el.style.getPropertyValue("--ambx-percent")).toBe("0.25");
    expect(el.style.getPropertyValue("--ambx-angle")).toBe("-67.5deg");
    expect(el.style.getPropertyValue("--ambx-travel-sweep")).toBe("270deg");
  });

  it("is controlled: the prop wins over internal state", async () => {
    function Harness() {
      const [v, setV] = useState(10);
      return <AmbientRotary aria-label="gain" value={v} onChange={setV} />;
    }
    render(<Harness />);
    const el = screen.getByRole("slider");
    await userEvent.tab();
    await userEvent.keyboard("{ArrowUp}");
    // Controlled: re-renders at 11 because the harness applies onChange.
    expect(el.getAttribute("aria-valuenow")).toBe("11");
  });

  it("ignores the keyboard while disabled", async () => {
    render(<AmbientRotary aria-label="gain" disabled defaultValue={5} />);
    const el = screen.getByRole("slider");
    expect(el.getAttribute("aria-disabled")).toBe("true");
    await userEvent.tab(); // tabIndex is -1; nothing focused
    await userEvent.keyboard("{ArrowUp}");
    expect(el.getAttribute("aria-valuenow")).toBe("5");
  });

  it("renders its label into an ambx-label span and wires aria-labelledby", () => {
    render(<AmbientRotary label="Gain" />);
    const label = screen.getByText("Gain");
    const el = screen.getByRole("slider");
    expect(label.className).toContain("ambx-label");
    expect(el.getAttribute("aria-labelledby")).toBe(label.id);
  });
});

describe("AmbientTravel", () => {
  it("lies along its orientation class with slider ARIA", () => {
    render(
      <AmbientTravel aria-label="level" orientation="horizontal" min={0} max={100} defaultValue={40} />
    );
    const el = screen.getByRole("slider");
    expect(el.className).toContain("ambx-travel-horizontal");
    expect(el.getAttribute("aria-valuenow")).toBe("40");
  });

  it("steps with both arrow axes", async () => {
    render(<AmbientTravel aria-label="level" defaultValue={40} />);
    const el = screen.getByRole("slider");
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    expect(el.getAttribute("aria-valuenow")).toBe("41");
    await userEvent.keyboard("{ArrowDown}");
    expect(el.getAttribute("aria-valuenow")).toBe("40");
  });

  it("inverts its key direction", async () => {
    render(<AmbientTravel aria-label="level" invert defaultValue={40} />);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getByRole("slider").getAttribute("aria-valuenow")).toBe("39");
  });

  it("snaps detented values onto the detent grid on Home/End", async () => {
    render(<AmbientTravel aria-label="level" min={0} max={3} step={1} defaultValue={1} detents={4} />);
    const el = screen.getByRole("slider");
    await userEvent.tab();
    await userEvent.keyboard("{Home}");
    expect(el.getAttribute("aria-valuenow")).toBe("0");
    expect(el.style.getPropertyValue("--ambx-detents")).toBe("4");
  });
});

describe("AmbientPress", () => {
  it("fires onPress once per click in momentary mode", async () => {
    const onPress = vi.fn();
    render(<AmbientPress onPress={onPress}>Go</AmbientPress>);
    const el = screen.getByRole("button");
    await userEvent.click(el);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(el.hasAttribute("data-pressed")).toBe(false);
  });

  it("toggles aria-pressed in toggle mode", async () => {
    render(<AmbientPress mode="toggle">Mute</AmbientPress>);
    const el = screen.getByRole("button");
    expect(el.getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(el);
    expect(el.getAttribute("aria-pressed")).toBe("true");
    expect(el.hasAttribute("data-pressed")).toBe(true);
  });

  it("repeats while held in repeat mode, without double-firing on release", async () => {
    vi.useFakeTimers();
    const onPress = vi.fn();
    render(<AmbientPress mode="repeat" repeatDelay={100} repeatInterval={50} onPress={onPress} />);
    const el = screen.getByRole("button");
    fireEvent.pointerDown(el, { button: 0 });
    expect(onPress).toHaveBeenCalledTimes(1); // immediate fire
    vi.advanceTimersByTime(260);
    // delay(100) then ticks every 50ms: 3 more fires within 160ms after it.
    expect(onPress).toHaveBeenCalledTimes(4);
    fireEvent.pointerUp(el);
    expect(onPress).toHaveBeenCalledTimes(4); // no extra click-fire
    vi.useRealTimers();
  });

  it("does nothing while disabled", async () => {
    const onPress = vi.fn();
    render(<AmbientPress disabled onPress={onPress}>No</AmbientPress>);
    await userEvent.click(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("AmbientLatch", () => {
  it("flips aria-checked as a switch", async () => {
    const onChange = vi.fn();
    render(<AmbientLatch aria-label="power" onChange={onChange} />);
    const el = screen.getByRole("switch");
    expect(el.getAttribute("aria-checked")).toBe("false");
    await userEvent.click(el);
    expect(el.getAttribute("aria-checked")).toBe("true");
    expect(onChange).toHaveBeenCalledWith(true);
    expect(el.hasAttribute("data-at-max")).toBe(true);
  });

  it("respects a controlled value", async () => {
    function Harness() {
      const [on, setOn] = useState(false);
      return <AmbientLatch aria-label="power" value={on} onChange={setOn} />;
    }
    render(<Harness />);
    const el = screen.getByRole("switch");
    await userEvent.click(el);
    expect(el.getAttribute("aria-checked")).toBe("true");
    await userEvent.click(el);
    expect(el.getAttribute("aria-checked")).toBe("false");
  });

  it("stays put while disabled", async () => {
    render(<AmbientLatch aria-label="power" disabled defaultValue />);
    const el = screen.getByRole("switch");
    expect(el.hasAttribute("disabled")).toBe(true);
    await userEvent.click(el);
    expect(el.getAttribute("aria-checked")).toBe("true");
  });
});

describe("AmbientBank", () => {
  const options = [
    { value: "sine" },
    { value: "square" },
    { value: "tri", disabled: true }
  ];

  it("renders one button per option with radiogroup semantics", () => {
    render(<AmbientBank aria-label="wave" options={options} defaultValue="sine" />);
    const group = screen.getByRole("radiogroup");
    expect(group.className).toContain("ambx-bank-vertical");
    const keys = screen.getAllByRole("radio");
    expect(keys).toHaveLength(3);
    expect(keys[0].getAttribute("aria-checked")).toBe("true");
    expect(keys[2].hasAttribute("disabled")).toBe(true); // per-option disabled
  });

  it("selects on click and reports the change", async () => {
    const onChange = vi.fn();
    render(<AmbientBank aria-label="wave" options={options} onChange={onChange} />);
    const keys = screen.getAllByRole("radio");
    await userEvent.click(keys[1]);
    expect(keys[1].getAttribute("aria-checked")).toBe("true");
    expect(onChange).toHaveBeenCalledWith("square");
  });

  it("supports multiple selection", async () => {
    render(<AmbientBank aria-label="fx" multiple options={options} defaultValue={["sine"]} />);
    /* Multiple mode reads as a checkbox group, not a radiogroup — an
       independent lamp each, not one-of-N. */
    const keys = screen.getAllByRole("checkbox");
    await userEvent.click(keys[1]);
    expect(keys[0].getAttribute("aria-checked")).toBe("true");
    expect(keys[1].getAttribute("aria-checked")).toBe("true");
  });

  it("publishes each key's own state channel", async () => {
    render(<AmbientBank aria-label="wave" options={options} defaultValue="square" />);
    const keys = screen.getAllByRole("radio");
    expect((keys[1] as HTMLElement).style.getPropertyValue("--ambx-percent")).toBe("1");
    expect(keys[0].hasAttribute("data-at-min")).toBe(true);
    await userEvent.click(keys[0]);
    expect((keys[0] as HTMLElement).style.getPropertyValue("--ambx-percent")).toBe("1");
    expect((keys[1] as HTMLElement).style.getPropertyValue("--ambx-percent")).toBe("0");
  });

  it("maps options through renderKey", () => {
    render(
      <AmbientBank
        aria-label="wave"
        options={options}
        renderKey={(option, on) => <span>{`${option.value}:${on ? "on" : "off"}`}</span>}
      />
    );
    expect(screen.getByText("sine:off")).toBeTruthy();
    expect(screen.getByText("tri:off")).toBeTruthy();
  });
});
