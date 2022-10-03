import { getCurrentWindow } from "@electron/remote";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Suspense, useEffect } from "react";
import AnnotationList, { Refresh } from "@component/annot-list";
import { activeFileAtom, pluginAtom } from "@component/atoms/obsidian";
import { manualRefreshAtom } from "@component/atoms/refresh";
import { AttachmentSelect } from "./atch-select";

export const AnnotView = () => {
  const [activeDoc, setActiveDoc] = useAtom(activeFileAtom);
  const refresh = useSetAtom(manualRefreshAtom);
  const plugin = useAtomValue(pluginAtom);

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
    return () => {
      app.workspace.off("active-leaf-change", updateActiveDoc);
    };
  }, [plugin.settings.autoRefreshOnFocus, refresh, setActiveDoc]);
  useEffect(() => {
    if (!plugin.settings.autoRefreshOnFocus) return;
    const focused = async () => {
      await sleep(500);
      const outOfDate = !(await plugin.db.isUpToDate());
      if (outOfDate) refresh();
    };
    const window = getCurrentWindow();
    window.on("focus", focused);
    return () => {
      window.off("focus", focused);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plugin.settings.autoRefreshOnFocus, refresh]);
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
