import React from "react";
import ReactDOM from "react-dom";
import { AnnotViewContext, ObsidianContext } from "./components";
import { PrepareNote } from "./components/note-fields";
import { CheckboxDemo } from "./components/status/importing";
import "./index.css";
import { annotViewCtx, context } from "./mock";
import { NoteFieldsMock } from "./mock/note-fields";

// for (const id of ["right", "main"]) {
//   ReactDOM.render(
//     <React.StrictMode>
//       <ObsidianContext.Provider value={context}>
//         <AnnotViewContext.Provider value={annotViewCtx}>
//           <PrepareNote onClick={() => void 0} />
//         </AnnotViewContext.Provider>
//       </ObsidianContext.Provider>
//     </React.StrictMode>,
//     document.getElementById(id) as HTMLElement,
//   );
// }

ReactDOM.render(
  <React.StrictMode>
    <ObsidianContext.Provider value={context}>
      <CheckboxDemo id="111" title="hello" />
    </ObsidianContext.Provider>
  </React.StrictMode>,
  document.getElementById("status-bar-item") as HTMLElement,
);
