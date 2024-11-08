import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import "./index.css";
import App2 from "./App2";

const root = document.getElementById("root");
const reactRoot = !root ? undefined : ReactDOM.createRoot(root);

const router = createBrowserRouter([
  {
    path: "*",
    element: <Navigate to={"/planet-sim"} />,
  },
  {
    // This must match "homepage" in package.json to work with GitHub pages
    path: "/planet-sim",
    element: <App2 />,
  },
]);

reactRoot?.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
