import { useAtom } from "jotai";
import { Suspense, useEffect } from "react";
import AnnotationList, { Refresh } from "@component/annot-list";
import { activeDocAtom } from "@component/atoms";
import { AttachmentSelect } from "./atch-select";

export const AnnotView = () => {
  const [activeDoc, setActiveDoc] = useAtom(activeDocAtom);
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
      {activeDoc ? (
        <>
          <div className="annot-toolbar">
            <Refresh />
            <Suspense fallback="loading attachments...">
              <AttachmentSelect />
            </Suspense>
          </div>
          <Suspense fallback="loading annotations...">
            <AnnotationList />
          </Suspense>
        </>
      ) : (
        <div className="pane-empty">Active file not literature note</div>
      )}
    </div>
  );
};
