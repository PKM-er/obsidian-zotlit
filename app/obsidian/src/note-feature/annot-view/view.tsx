import type { AttachmentInfo } from "@obzt/database";
import { Provider, useAtomValue, useSetAtom } from "jotai";
import type { WorkspaceLeaf } from "obsidian";
import { ItemView } from "obsidian";
import { Suspense, useEffect } from "react";
import { createRoot } from "react-dom/client";
import AnnotationList from "@component/annot-list";
import {
  activeDocAtom,
  atchIdAtom,
  atchsAtom,
  createInitialValues,
  pluginAtom,
  setAtchIdAtom,
} from "@component/atoms";
import type ZoteroPlugin from "../../zt-main";

export const annotViewType = "zotero-annotation-view";

export class AnnotationView extends ItemView {
  constructor(leaf: WorkspaceLeaf, public plugin: ZoteroPlugin) {
    super(leaf);
  }
  root = createRoot(this.contentEl);

  public getViewType(): string {
    return annotViewType;
  }

  public getDisplayText(): string {
    return "Zotero Annotations";
  }

  public getIcon(): string {
    return "highlighter";
  }

  protected async onOpen() {
    await super.onOpen();
    const initVals = createInitialValues();
    initVals.set(pluginAtom, this.plugin);
    this.root.render(
      <Provider initialValues={initVals.get()}>
        <Suspense fallback="loading">
          <AnnotView />
        </Suspense>
      </Provider>,
    );
  }
  protected async onClose() {
    this.root.unmount();
    await super.onClose();
  }
}

const AnnotView = () => {
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
      <div>
        <AttachmentSelect />
      </div>
      <AnnotationList />
    </div>
  );
};

type Attachment = Omit<AttachmentInfo, "itemID"> & { itemID: number };
const AttachmentSelect = () => {
  const attachments = useAtomValue(atchsAtom);
  const setAtchId = useSetAtom(setAtchIdAtom);
  const atchId = useAtomValue(atchIdAtom);

  if (!attachments || attachments.length <= 0) {
    return <>No attachments available</>;
  } else if (attachments.length === 1) {
    return null;
  } else {
    return (
      <select onChange={setAtchId} value={atchId ?? undefined}>
        {attachments
          .filter((item): item is Attachment => item.itemID !== null)
          .map(({ itemID, path, count }) => {
            return (
              <option key={itemID} value={itemID}>
                {path}: {count}
              </option>
            );
          })}
      </select>
    );
  }
};
