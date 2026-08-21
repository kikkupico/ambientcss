import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

beforeAll(() => {
  /* jsdom reports every rect as zeros, which the rotary's angle mapping
     divides by; a fixed square keeps the geometry deterministic. */
  Element.prototype.getBoundingClientRect = function () {
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON() {}
    };
  };
});

afterEach(() => {
  cleanup();
});

afterAll(() => {
  // @ts-expect-error restore for other suites sharing the worker
  delete Element.prototype.getBoundingClientRect;
});
