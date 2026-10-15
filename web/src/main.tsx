import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Dos entradas en la misma SPA: la portada (`/`) y el panel (`/app`). Se cargan por separado
// para que la portada no descargue el código del panel.
const Showcase = lazy(() => import("./showcase/Showcase"));
const App = lazy(() => import("./App"));

const esPanel = location.pathname === "/app" || location.pathname.startsWith("/app/");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={null}>{esPanel ? <App /> : <Showcase />}</Suspense>
  </StrictMode>,
);
