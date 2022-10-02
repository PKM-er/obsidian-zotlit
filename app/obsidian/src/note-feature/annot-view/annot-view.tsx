import { useAtom } from "jotai";
import { Suspense, useEffect } from "react";
import AnnotationList, { Refresh } from "@component/annot-list";
import { activeFileAtom } from "@component/atoms/obsidian";
import { AttachmentSelect } from "./atch-select";

export const AnnotView = () => {
  const [activeDoc, setActiveDoc] = useAtom(activeFileAtom);
  useEffect(() => {
    const updateActiveDoc = () => {
      const activeFile = app.workspace.getActiveFile();
      if (activeFile?.extension === "md") {
        setActiveDoc(activeFile.path);
      } else {
        setActiveDoc(null);
      }
    };
    updateActiveDoc();
    app.workspace.on("active-leaf-change", updateActiveDoc);
    return () => app.workspace.off("active-leaf-change", updateActiveDoc);
  }, [setActiveDoc]);
  return (
    <div className="annot-view">
      {activeDoc !== null ? (
        <>
          <div className="annot-view-header">
            <div className="annot-view-button-container">
              <Refresh />
            </div>
            <Suspense fallback={null}>
              <AttachmentSelect />
            </Suspense>
          </div>
          <Suspense fallback={null}>
            <AnnotationList />
          </Suspense>
        </>
      ) : (
        <div className="pane-empty">Active file not literature note</div>
      )}
    </div>
  );
};
