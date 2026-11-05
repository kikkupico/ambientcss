import Layout from "@theme/Layout";
import BrowserOnly from "@docusaurus/BrowserOnly";

/* Client-only: the builder reads its config out of the address bar (or
   local storage) on the first render, so server-rendering it would hydrate
   against a different config than the link asked for. */

export default function KitBuilderPage() {
  return (
    <Layout
      title="Kit Builder"
      description="Design an Ambient CSS control kit visually: pick a starting look, edit each control's layers, then export the module."
    >
      <BrowserOnly fallback={<div className="kb-loading">Loading the Kit Builder…</div>}>
        {() => {
          const KitBuilder = require("@site/src/components/kit-builder/KitBuilder").default;
          return <KitBuilder />;
        }}
      </BrowserOnly>
    </Layout>
  );
}
