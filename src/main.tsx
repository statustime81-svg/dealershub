import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";

import App from "./App";
import { AppProviders } from "./app/providers";

import "./styles/globals.css";


const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'DealersHub could not start: the "root" element is missing.',
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);