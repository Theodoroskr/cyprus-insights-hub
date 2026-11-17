import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installImageFallback } from "./lib/fallbackImage";
import { hostRedirect } from "./lib/edition";

// Send visitors to the right domain (businesshub.gr / businesshub.cy) before anything renders.
const moveTo = hostRedirect(window.location.hostname, window.location.pathname, window.location.search + window.location.hash);

if (moveTo) {
  window.location.replace(moveTo);
} else {
  installImageFallback();
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
