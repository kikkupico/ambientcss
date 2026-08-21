---
"@ambientcss/components": patch
---

Add a test suite for the bare mechanisms (AmbientRotary, AmbientTravel, AmbientPress, AmbientLatch, AmbientBank) covering ARIA, the keyboard contract, the state channel and controlled/uncontrolled behaviour. Fix an AmbientBank bug the suite surfaced: `useBank.keyProps()` included a `key` prop that was spread into JSX, making React warn and dropping keys on release builds — the key now lives at the mapping site in `AmbientBank`.
