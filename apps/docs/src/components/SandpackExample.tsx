import React from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react";

type SandpackExampleProps = {
  /** "static" for CSS-only HTML examples, "react-ts" for React examples */
  template?: "static" | "react-ts";
  /** File map passed to Sandpack. Keys are absolute paths, e.g. "/index.html" */
  files: Record<string, string>;
  /** Extra npm packages. For React examples include @ambientcss/components here. */
  dependencies?: Record<string, string>;
  /**
   * CDN URLs injected into the preview iframe as <link> or <script> tags.
   * URLs ending in .css become <link rel="stylesheet">.
   * Other URLs (including extension-less CDN scripts) become <script>.
   */
  externalResources?: string[];
  /** Height in px applied to both the editor and the preview pane. Default 320 */
  previewHeight?: number;
};

export function SandpackExample({
  template = "react-ts",
  files,
  dependencies = {},
  externalResources = [],
  previewHeight = 320,
}: SandpackExampleProps) {
  return (
    <SandpackProvider
      template={template}
      files={files}
      customSetup={{ dependencies }}
      options={{ externalResources }}
      theme="dark"
    >
      <SandpackLayout>
        <SandpackCodeEditor style={{ height: previewHeight }} showLineNumbers />
        <SandpackPreview style={{ height: previewHeight }} showNavigator={false} />
      </SandpackLayout>
    </SandpackProvider>
  );
}
