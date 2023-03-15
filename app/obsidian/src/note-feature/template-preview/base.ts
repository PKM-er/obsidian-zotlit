import { createStore } from "@obzt/components";
import type { AnnotationInfo, ItemIDLibID } from "@obzt/database";
import type { TFile, ViewStateResult, WorkspaceLeaf } from "obsidian";
import { FileView } from "obsidian";
import type { HelperExtra } from "@/services/template/helper";
import type { EjectableTemplate } from "@/services/template/settings";
import { untilZoteroReady } from "@/utils/once";
import type ZoteroPlugin from "@/zt-main";

export type PreviewData = HelperExtra & { annot?: AnnotationInfo };
export interface TemplatePreviewStateData {
  docItem: number;
  attachment?: number;
  annot?: number;
}

export const toCtx = (plugin: ZoteroPlugin) => ({ plugin, sourcePath: "" });

export interface TemplatePreviewState {
  preview: TemplatePreviewStateData | null;
}
export interface IStore {
  templateType: EjectableTemplate | null;
  setTemplateType(type?: EjectableTemplate | false): void;
  preview: PreviewData | null;
  setPreview(data: PreviewData | null): void;
  setPreviewFromState(
    stateData: TemplatePreviewStateData,
    plugin: ZoteroPlugin,
  ): Promise<boolean>;
}

export type StoreApi = ReturnType<typeof create>;

export function create() {
  return createStore<IStore>((set, get) => ({
    preview: null,
    templateType: null,
    setTemplateType(type) {
      set((state) => ({ ...state, templateType: type ? type : undefined }));
    },
    setPreview(data) {
      set(({ ...state }) => ({
        ...state,
        preview: data ?? null,
      }));
    },
    async setPreviewFromState(
      stateData: TemplatePreviewStateData,
      plugin: ZoteroPlugin,
    ): Promise<boolean> {
      const curr = get().preview;
      if (
        curr?.docItem.itemID === stateData?.docItem &&
        curr?.attachment?.itemID === stateData?.attachment &&
        curr?.annot?.itemID === stateData?.annot
      ) {
        return false;
      }
      const libId = plugin.database.settings.citationLibrary;
      if (!stateData.docItem) {
        console.error("TemplatePreview: no docItem provided");
        return false;
      }

      const [docItem] = await plugin.databaseAPI.getItems([
        [stateData.docItem, libId],
      ]);
      if (!docItem) {
        console.error(
          "TemplatePreview: no docItem found for id " + stateData.docItem,
        );
        return false;
      }
      const allAttachments = await plugin.databaseAPI.getAttachments(
        stateData.docItem,
        libId,
      );

      const attachment =
        allAttachments.find((i) => i.itemID === stateData.attachment) ?? null;

      if (stateData.attachment && !attachment) {
        console.error(
          "TemplatePreview: no attachment found for id " + stateData.attachment,
        );
      }

      const annotations: AnnotationInfo[] = attachment
        ? await plugin.databaseAPI.getAnnotations(attachment.itemID, libId)
        : [];

      const annot = annotations.find((i) => i.itemID === stateData.annot);
      if (stateData.annot && !annot) {
        console.error(
          "TemplatePreview: no annotation found for id " + stateData.annot,
        );
      }

      const tags = await plugin.databaseAPI.getTags([
        [stateData.docItem, libId],
        ...annotations.map((i): ItemIDLibID => [i.itemID, libId]),
      ]);

      set(() => ({
        preview: {
          docItem,
          allAttachments,
          annotations,
          attachment,
          tags,
          annot: annotations.find((i) => i.itemID === stateData.annot),
        },
      }));
      return true;
    },
  }));
}

export function asyncDebounce<T extends unknown[], V>(
  cb: (...args: [...T]) => Promise<V>,
  timeout?: number,
): (...args: [...T]) => void {
  let timeoutId: number | null = null;
  let pending: Promise<any> | null = null;

  let taskDuringPending: [...T] | null = null;
  return function (...args) {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
    if (pending) {
      taskDuringPending = args;
      return;
    }
    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      pending = cb(...args)
        .then(() => {
          if (taskDuringPending) {
            pending = cb(...taskDuringPending);
          } else {
            pending = null;
          }
        })
        .catch((error) => {
          console.error(error);
          pending = null;
        });
    }, timeout);
  };
}

export abstract class TemplatePreviewBase extends FileView {
  store: ReturnType<typeof create>;
  constructor(leaf: WorkspaceLeaf, public plugin: ZoteroPlugin) {
    super(leaf);
    this.store = create();
  }
  canAcceptExtension(extension: string): boolean {
    return extension === "md";
  }
  get enabled() {
    return this.plugin.templateLoader.settings.ejected;
  }
  getTemplateType(file: TFile) {
    return this.plugin.templateLoader.getTemplateTypeOf(file);
  }
  setTemplateType(type?: EjectableTemplate | false) {
    this.store.getState().setTemplateType(type);
  }
  async onLoadFile(file: TFile): Promise<void> {
    await super.onLoadFile(file);
    this.setTemplateType(this.enabled && this.getTemplateType(file));
  }

  getState(): TemplatePreviewState {
    const baseState = super.getState();
    const { preview } = this.store.getState();
    let state: TemplatePreviewState;
    if (!preview) {
      state = { preview: null };
    } else {
      const { docItem, attachment, annot } = preview;
      state = {
        preview: {
          docItem: docItem.itemID,
          attachment: attachment?.itemID,
          annot: annot?.itemID,
        },
      };
    }
    return { ...baseState, ...state };
  }
  async setState(
    nextState: TemplatePreviewState,
    result: ViewStateResult,
  ): Promise<void> {
    await super.setState(nextState, result);
    if (nextState.preview === undefined) {
      return;
    }
    const state = this.store.getState();
    if (nextState.preview === null) {
      state.setPreview(null);
    } else {
      await state.setPreviewFromState(nextState.preview, this.plugin);
    }
  }
  setPreview(data: PreviewData) {
    this.store.getState().setPreview(data);
  }

  protected async onOpen() {
    await super.onOpen();
    const [task, cancel] = untilZoteroReady(this.plugin);
    cancel && this.register(cancel);
    await task;
  }
}
