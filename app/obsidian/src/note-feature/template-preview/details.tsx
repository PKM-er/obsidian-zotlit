import { useStore } from "@obzt/components";
import { useMemo } from "react";
import ReactDOM from "react-dom";
import ItemDetails from "@/components/item-details";
import { withAnnotHelper, withDocItemHelper } from "@/services/template/helper";
import { untilZoteroReady } from "@/utils/once";
import type ZoteroPlugin from "@/zt-main";
import { toCtx, TemplatePreviewBase } from "./base";
import type { IStore, StoreApi } from "./base";

export const itemDetailsViewType = "zotero-item-details";

const selectTemplateType = ({ templateType: type }: IStore) =>
  type === "annotation" ? type : "note";

export class ItemDetailsView extends TemplatePreviewBase {
  getViewType(): string {
    return itemDetailsViewType;
  }
  getDisplayText(): string {
    const state = this.store.getState();
    if (state.templateType) {
      return "Zotero Item Details: " + selectTemplateType(state);
    } else {
      return "Zotero Item Details";
    }
  }
  protected async onOpen() {
    await super.onOpen();
    const [task, cancel] = untilZoteroReady(this.plugin);
    cancel && this.register(cancel);
    await task;
    ReactDOM.render(
      <Main store={this.store} plugin={this.plugin} />,
      this.contentEl,
    );
  }
  protected async onClose() {
    ReactDOM.unmountComponentAtNode(this.contentEl);
    await super.onClose();
  }
}

function Main({ store, plugin }: { store: StoreApi; plugin: ZoteroPlugin }) {
  const type = useStore(store, selectTemplateType);
  const preview = useStore(store, (s) => s.preview);
  const item = useMemo(() => {
    const ctx = toCtx(plugin);
    if (!preview) return null;
    const { docItem, allAttachments, attachment, tags } = preview;
    switch (type) {
      case "note": {
        const helper = withDocItemHelper(
          docItem,
          { tags, attachment, allAttachments },
          ctx,
        );
        // @ts-expect-error no recursive in preview
        helper.annotations = undefined;
        return helper;
      }
      case "annotation": {
        const annot = preview.annot ?? preview.annotations[0];
        if (!annot) return null;
        const helper = withAnnotHelper(annot, { tags, attachment }, ctx);
        // @ts-expect-error no recursive in preview
        helper.docItem = undefined;
        return helper;
      }
      default:
        throw new Error("Unsupported template type");
    }
  }, [plugin, preview, type]);
  return item ? (
    <ItemDetails
      item={item}
      registerCssChange={(cb) => {
        plugin.app.workspace.on("css-change", cb);
        return () => plugin.app.workspace.off("css-change", cb);
      }}
    />
  ) : (
    <div></div>
  );
}
