/* What you take away: the kit module, its stylesheet when it draws shapes,
 *  and the few lines that put it to use. One tab per file, each with copy
 *  and download, and the share link beside them. */

import { useEffect, useRef, useState } from "react";
import CodeBlock from "@theme/CodeBlock";

export type ExportFile = {
  id: string;
  /** What the tab says. */
  label: string;
  /** What it downloads as. */
  name: string;
  language: string;
  note: string;
  contents: string;
};

export function download(name: string, contents: string) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  /* Not synchronously: revoking in the same tick races the download. */
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function useCopy(): [string | null, (key: string, text: string) => void] {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const copy = (key: string, text: string) => {
    if (!navigator.clipboard) return;
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(null), 1600);
    });
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [copied, copy];
}

export function ExportDialog({
  files,
  shareUrl,
  hiddenCount,
  onClose
}: {
  files: ExportFile[];
  shareUrl: string | null;
  hiddenCount: number;
  onClose: () => void;
}) {
  const [tab, setTab] = useState(files[0]?.id ?? "");
  const [copied, copy] = useCopy();
  const dialog = useRef<HTMLDivElement>(null);
  const file = files.find((candidate) => candidate.id === tab) ?? files[0];

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [onClose]);

  const downloadable = files.filter((candidate) => candidate.id !== "usage");

  return (
    <div className="kb-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialog}
        className="kb-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-export-title"
        tabIndex={-1}
      >
        <header className="kb-dialog-head">
          <div>
            <h2 id="kb-export-title" className="kb-dialog-title">
              Export your kit
            </h2>
            <p className="kb-dialog-sub">
              {downloadable.length > 1
                ? `${downloadable.length} files. Put them side by side in your project.`
                : "One file. Drop it in your project."}
            </p>
          </div>
          <button type="button" className="kb-btn kb-btn-ghost kb-btn-icon" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>

        {hiddenCount > 0 ? (
          <p className="kb-note kb-note-warn kb-dialog-warn">
            {hiddenCount} hidden {hiddenCount === 1 ? "layer is" : "layers are"} left out of the
            export.
          </p>
        ) : null}

        <div className="kb-dialog-tabs" role="tablist" aria-label="Files">
          {files.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              role="tab"
              aria-selected={candidate.id === file?.id}
              className={`kb-dialog-tab${candidate.id === file?.id ? " kb-dialog-tab-on" : ""}`}
              onClick={() => setTab(candidate.id)}
            >
              {candidate.label}
            </button>
          ))}
        </div>

        {file ? (
          <div className="kb-dialog-body" role="tabpanel">
            <div className="kb-dialog-file-bar">
              <p className="kb-dialog-note">{file.note}</p>
              <div className="kb-dialog-actions">
                <button type="button" className="kb-btn" onClick={() => copy(file.id, file.contents)}>
                  <Icon name={copied === file.id ? "check" : "copy"} />
                  {copied === file.id ? "Copied" : "Copy"}
                </button>
                {file.id !== "usage" ? (
                  <button type="button" className="kb-btn" onClick={() => download(file.name, file.contents)}>
                    <Icon name="download" />
                    Download
                  </button>
                ) : null}
              </div>
            </div>
            <div className="kb-dialog-code">
              <CodeBlock language={file.language} title={file.name}>
                {file.contents}
              </CodeBlock>
            </div>
          </div>
        ) : null}

        <footer className="kb-dialog-foot">
          <div className="kb-share">
            <label className="kb-share-label" htmlFor="kb-share-url">
              Share link
            </label>
            <input
              id="kb-share-url"
              className="kb-text kb-mono kb-share-url"
              readOnly
              value={shareUrl ?? ""}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button type="button" className="kb-btn" disabled={!shareUrl} onClick={() => shareUrl && copy("link", shareUrl)}>
              <Icon name={copied === "link" ? "check" : "link"} />
              {copied === "link" ? "Copied" : "Copy link"}
            </button>
          </div>
          {downloadable.length > 1 ? (
            <button
              type="button"
              className="kb-btn kb-btn-primary"
              onClick={() => {
                downloadable.forEach((candidate, i) =>
                  /* Spaced out: browsers drop a second download started in
                     the same tick as the first. */
                  window.setTimeout(() => download(candidate.name, candidate.contents), i * 250)
                );
              }}
            >
              <Icon name="download" />
              Download all
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

/* ── Icons ────────────────────────────────────────────────────────────── */

const PATHS: Record<string, string> = {
  undo: "M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11",
  redo: "m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13",
  link: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
  code: "m16 18 6-6-6-6M8 6l-6 6 6 6",
  copy: "M8 8h12v12H8zM16 8V4H4v12h4",
  check: "M20 6 9 17l-5-5",
  download: "M12 3v12m0 0-5-5m5 5 5-5M4 21h16",
  close: "M18 6 6 18M6 6l12 12",
  plus: "M12 5v14M5 12h14",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  eyeOff: "M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2",
  up: "m18 15-6-6-6 6",
  down: "m6 9 6 6 6-6",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  duplicate: "M9 9h11v11H9zM5 15H4V4h11v1",
  sun: "M12 3v2M12 19v2M5 5l1.4 1.4M17.6 17.6 19 19M3 12h2M19 12h2M5 19l1.4-1.4M17.6 6.4 19 5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  rack: "M4 4h16v16H4zM4 12h16M12 4v8",
  focus: "M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5",
  back: "m15 18-6-6 6-6",
  reset: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
  sliders: "M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"
};

export function Icon({ name, size = 16 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg
      className="kb-icon-svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[name] ?? ""} />
    </svg>
  );
}
