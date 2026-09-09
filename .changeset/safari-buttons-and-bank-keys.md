---
"@ambientcss/components": patch
---

Fix round and square buttons losing their clearance ring in Safari, and make
bank arrow keys work on both axes.

`.amb-button-round` and `.amb-button-square` carried `aspect-ratio: 1` on the
same box as the `padding` their ring is drawn from. CSS Sizing 4 applies a
preferred ratio to the border box under `box-sizing: border-box`; WebKit
applies it to the content box and adds the padding back, so the well came out
taller than it was wide and the cap's `height: 100%` overflowed it — the ring
survived on the top and left and was eaten on the bottom and right. The two
wells are grid containers now, which resolves the ratio the same way in every
engine and lets the cap stretch on its own. Chrome rendering is unchanged.

`useBank` bound its arrow keys to the bank's visual orientation, so a
horizontal bank ignored Up/Down and a vertical one ignored Left/Right. A
native radio group answers all four arrows whatever the layout; both axes now
step, and `aria-orientation` still reports the layout.
