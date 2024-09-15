import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = document.getElementById("root");
const reactRoot = !root ? undefined : ReactDOM.createRoot(root);

reactRoot?.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
