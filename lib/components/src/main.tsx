import React from "react";
import ReactDOM from "react-dom";
import { AnnotsView, AnnotsViewContext, ObsidianContext } from "./components";
import "./index.css";
import { annotViewCtx, context } from "./mock";

for (const id of ["right", "main"]) {
  ReactDOM.render(
    <React.StrictMode>
      <ObsidianContext.Provider value={context}>
        <AnnotsViewContext.Provider value={annotViewCtx}>
          <AnnotsView />
        </AnnotsViewContext.Provider>
      </ObsidianContext.Provider>
    </React.StrictMode>,
    document.getElementById(id) as HTMLElement,
  );
}
