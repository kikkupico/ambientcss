import Layout from "@theme/Layout";
import BrowserOnly from "@docusaurus/BrowserOnly";

/* Client-only: the builder reads its config out of the address bar on the
   first render, so server-rendering it would hydrate against a different
   config than the link asked for. */

export default function KitBuilderPage() {
  return (
    <Layout
      title="Kit Builder"
      description="Build an Ambient CSS control kit by choosing parts, then take the module away."
    >
      <BrowserOnly fallback={<div style={{ padding: 48 }}>Loading the kit builder…</div>}>
        {() => {
          const KitBuilder = require("@site/src/components/kit-builder/KitBuilder").default;
          return <KitBuilder />;
        }}
      </BrowserOnly>
    </Layout>
  );
}
