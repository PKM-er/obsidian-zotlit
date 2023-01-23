import React from "react";
import ReactDOM from "react-dom";
import { AnnotsView, AnnotsViewContext } from "./components";
import "./index.css";
import { context } from "./mock";

for (const id of ["right", "main"]) {
  ReactDOM.render(
    <React.StrictMode>
      <AnnotsViewContext.Provider value={context}>
        <AnnotsView />
      </AnnotsViewContext.Provider>
    </React.StrictMode>,
    document.getElementById(id) as HTMLElement,
  );
}
