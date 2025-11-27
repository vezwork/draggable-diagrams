import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { DemoLayout } from "./DemoLayout";
import "./index.css";
import { PrettyPrintDemo } from "./pretty-print-demo";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<DemoLayout />} />
        <Route path="/pretty-print" element={<PrettyPrintDemo />} />
        <Route path="/:id" element={<DemoLayout />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
