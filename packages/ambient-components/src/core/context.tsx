import { createContext, useContext } from "react";
import type { ControlState } from "./types";
import type { BankOption } from "./useBank";

const ControlStateContext = createContext<ControlState | null>(null);

export const ControlStateProvider = ControlStateContext.Provider;

/** Read the enclosing control's state from inside a part.
 *
 *  This is the third outlet of the state channel, and the one to reach for
 *  last: the custom properties on the control root are canonical, and a
 *  part that can be styled from CSS should be. Use this when a part needs
 *  the value as a JS number — a readout, a tick ring that has to emit N
 *  children, an SVG whose path data depends on the value. */
export function useControlState(): ControlState {
  const state = useContext(ControlStateContext);
  if (!state) {
    throw new Error(
      "useControlState() must be called from inside a control's parts. " +
        "Pass the component through `parts` on AmbientRotary, AmbientTravel, " +
        "AmbientPress, AmbientLatch or AmbientBank."
    );
  }
  return state;
}

/** A bank key carries more than a number: its legend, its accessible name
 *  and its own lamp colour all belong to the option, not to the state. So a
 *  key's parts get this alongside `useControlState()`. */
export type BankKeyState = { option: BankOption; on: boolean; index: number };

const BankKeyContext = createContext<BankKeyState | null>(null);

export const BankKeyProvider = BankKeyContext.Provider;

export function useBankKey(): BankKeyState {
  const key = useContext(BankKeyContext);
  if (!key) {
    throw new Error(
      "useBankKey() must be called from inside a bank key's parts. Pass the " +
        "component through `keyParts` on AmbientBank."
    );
  }
  return key;
}
