import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";

/**
 * Docusaurus statically prerenders docs pages in Node, where WebGL doesn't
 * exist. ConceptScene3D pulls in three/@react-three/fiber/drei, which must
 * never be evaluated during that prerender — so the `require` is deferred
 * into BrowserOnly's render prop rather than imported at module top level.
 */
export function ConceptScene() {
  return (
    <BrowserOnly fallback={<div className="tdd-canvas-fallback" />}>
      {() => {
        const ConceptScene3D = require("./ConceptScene3D").default;
        return <ConceptScene3D />;
      }}
    </BrowserOnly>
  );
}
