import React from "react";

type Props = {
  /** Folder name inside examples/, e.g. "css-basic" */
  examplePath: string;
};

export function StackBlitzButton({ examplePath }: Props) {
  const url = `https://stackblitz.com/github/kikkupico/ambientcss/tree/master/examples/${examplePath}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 20,
        padding: "8px 16px",
        borderRadius: 8,
        background: "#1389FD",
        color: "#fff",
        fontWeight: 600,
        fontSize: "0.875rem",
        textDecoration: "none",
      }}
    >
      Open in StackBlitz ↗
    </a>
  );
}
