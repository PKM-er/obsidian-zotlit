import type { AttachmentInfo } from "@obzt/database";
import { useAtomValue, useSetAtom } from "jotai";
import { Suspense, useEffect } from "react";
import AnnotationList, { Refresh } from "@component/annot-list";
import {
  activeDocAtom,
  atchIdAtom,
  attachmentsAtom,
  setAtchIdAtom,
} from "@component/atoms";

export const AnnotView = () => {
  const setActiveDoc = useSetAtom(activeDocAtom);
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
    <div>
      <div className="annot-toolbar">
        <Refresh />
        <Suspense fallback="loading attachments...">
          <AttachmentSelect />
        </Suspense>
      </div>
      <Suspense fallback="loading annotations...">
        <AnnotationList />
      </Suspense>
    </div>
  );
};
type Attachment = Omit<AttachmentInfo, "itemID"> & { itemID: number };
const AttachmentSelect = () => {
  const attachments = useAtomValue(attachmentsAtom);
  const setAtchId = useSetAtom(setAtchIdAtom);
  const atchId = useAtomValue(atchIdAtom);

  if (!attachments || attachments.length <= 0) {
    return <span className="atch-select-empty">No attachments available</span>;
  } else if (attachments.length === 1) {
    return null;
  } else {
    return (
      <select
        className="atch-select"
        onChange={setAtchId}
        value={atchId ?? undefined}
      >
        {attachments
          .filter((item): item is Attachment => item.itemID !== null)
          .map(({ itemID, path, count }) => {
            return (
              <option key={itemID} value={itemID}>
                ({count}) {path?.replace(/^storage:/, "")}
              </option>
            );
          })}
      </select>
    );
  }
};
