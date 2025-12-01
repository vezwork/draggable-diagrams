import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes } from "react-router-dom";
import { autoRoute } from "./autoRoute";
import { demosCanvas } from "./canvas/demos";
import { DemoListPage, SingleDemoPage } from "./DemoLayout";
import { demos } from "./demos";
import "./index.css";
import { IndexPage } from "./IndexPage";
import { PrettyPrintDemo } from "./pretty-print-demo";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        {autoRoute("/", IndexPage)}
        {autoRoute("/demos", DemoListPage, { demos })}
        {autoRoute("/demos/:id", SingleDemoPage, { demos })}
        {autoRoute("/demos-canvas", DemoListPage, { demos: demosCanvas })}
        {autoRoute("/demos-canvas/:id", SingleDemoPage, { demos: demosCanvas })}
        {autoRoute("/pretty-print", PrettyPrintDemo)}
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
