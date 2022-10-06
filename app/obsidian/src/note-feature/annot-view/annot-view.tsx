import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Suspense, useEffect } from "react";
import AnnotationList, {
  CollapseButton,
  RefreshButton,
} from "@component/annot-list";
import { activeFileAtom, pluginAtom } from "@component/atoms/obsidian";
import { autoRefreshAtom } from "@component/atoms/refresh";
import { DocDetailsView } from "@component/item-view";
import { DocItemDetailsToggle } from "@component/item-view/item-details-toggle";
import { AttachmentSelect } from "./atch-select";

export const AnnotView = () => {
  const [activeDoc, setActiveDoc] = useAtom(activeFileAtom);
  const refresh = useSetAtom(autoRefreshAtom);
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
  }, [setActiveDoc]);
  useEffect(() => {
    const { db } = plugin;
    const ref = db.on("refresh", refresh);
    return () => {
      db.offref(ref);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plugin, refresh]);
  return (
    <div className="annot-view">
      {activeDoc !== null ? (
        <>
          <div className="annot-view-header">
            <div className="annot-view-button-container">
              <DocItemDetailsToggle />
              <CollapseButton />
              <RefreshButton />
            </div>
            <Suspense fallback={null}>
              <AttachmentSelect />
            </Suspense>
          </div>
          <DocDetailsView />
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
