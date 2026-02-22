import React from "react";
import ReactDOM from "react-dom/client";
import "@ambientcss/css/ambient.css";
import "@ambientcss/components/styles.css";
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
