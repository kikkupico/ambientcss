import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { isDev } from "./dev";
import { FRAME_ORDER } from "./types";
import type { ControlParts } from "./types";

/** Render the frames a control has parts for, in paint order.
 *
 *  Frames are markers by default (`display: contents` in styles.css) and
 *  become boxes only where the control has a size of its own — a rotary's
 *  rotating face, a travel thumb. That distinction is not cosmetic: a
 *  button takes its width from `min-width` plus its cap's legend, so an
 *  absolutely-positioned actuator would collapse it to nothing. */
export function Frames({ parts }: { parts?: ControlParts | undefined }) {
  if (!parts) return null;
  return (
    <>
      {FRAME_ORDER.map((name) =>
        parts[name] == null ? null : (
          <div key={name} data-frame={name} className={`ambx-frame ambx-frame-${name}`}>
            {parts[name]}
          </div>
        )
      )}
    </>
  );
}

const FOCUSABLE =
  "a[href], button, input, select, textarea, [tabindex], [contenteditable=true]," +
  "[role=button], [role=checkbox], [role=radio], [role=slider], [role=switch], [role=link]";

/** Development-only enforcement of the rule that parts are presentational.
 *
 *  The control root owns `role`, `aria-value*`, `tabIndex` and the keyboard
 *  handler. A part that smuggles in its own focusable element gives the
 *  control two tab stops and, usually, a second conflicting role.
 *
 *  Scoped to inside `[data-frame]` subtrees rather than to the whole root,
 *  because a bank's key IS a `<button>` that the mechanism renders and the
 *  frames sit inside it. Querying from the root would flag every preset we
 *  ship. */
export function useDevPartCheck(ref: RefObject<HTMLElement | null>, control: string): void {
  const warned = useRef(false);
  /* Mount only, and at most once. A part set is fixed by the code that wrote
     it, so re-querying on every render would buy nothing and cost a DOM walk
     on every frame of a drag. */
  useEffect(() => {
    if (!isDev || warned.current) return;
    const root = ref.current;
    if (!root) return;
    const offenders = root.querySelectorAll(`[data-frame] :is(${FOCUSABLE})`);
    if (offenders.length === 0) return;
    warned.current = true;
    const tags = Array.from(offenders, (node) => `<${node.tagName.toLowerCase()}>`).join(", ");
    console.warn(
      `[@ambientcss/components] ${control}: a part contains a focusable element ` +
        `(${tags}). Parts are presentational — the control root already owns the ` +
        `role, the tab stop and the keyboard handler, so this creates a second ` +
        `tab stop and usually a conflicting role.`
    );
  }, [ref, control]);
}
