import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import "./index.css";
import { WebGPUApp } from "./webGpu/WebGPUApp.js";

const root = document.getElementById("root");
const reactRoot = !root ? undefined : ReactDOM.createRoot(root);

const router = createBrowserRouter(
  [
    {
      path: "*",
      element: <Navigate to={"/planet-sim"} />,
    },
    {
      // This must match "homepage" in package.json to work with GitHub pages
      path: "/planet-sim",
      element: <WebGPUApp />,
    },
  ],
  {
    future: {
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_relativeSplatPath: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);

reactRoot?.render(
  <React.StrictMode>
    <RouterProvider
      router={router}
      future={{
        v7_startTransition: true,
      }}
    />
  </React.StrictMode>,
);
