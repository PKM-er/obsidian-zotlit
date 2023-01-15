import type {
  AnnotationInfo,
  AttachmentInfo,
  RegularItemInfo,
  TagInfo,
} from "@obzt/database";
import { isFileAttachment } from "@obzt/database";
import { createStore as create } from "zustand";
import type ZoteroPlugin from "../zt-main";

export interface DataModel {
  doc: { sourcePath: string; docItem: RegularItemInfo; lib: number } | null;
  attachment: AttachmentInfo | null;
  attachmentID: number | null;
  allAttachments: AttachmentInfo[] | null;
  annotations: AnnotationInfo[] | null;
  tags: Record<number, TagInfo[]>;
  loadDocItem(
    file: { path: string; itemKey: string } | null,
    lib: number,
    force?: boolean,
  ): Promise<void>;
  refresh: () => Promise<void>;
  setActiveAtch: (id: number) => void;
}

const toLocalStorageKey = (docItem: RegularItemInfo) =>
  `obzt-active-atch-${docItem.itemID}-${docItem.libraryID}`;

const getCachedActiveAtch = (docItem: RegularItemInfo) => {
  const raw = window.localStorage.getItem(toLocalStorageKey(docItem));
  if (!raw) return null;
  const val = parseInt(raw, 10);
  if (val > 0) return val;
  return null;
};

const getActiveAttachment = (
  cachedID: number | null,
  attachments: AttachmentInfo[],
) => {
  if (attachments.length === 0) {
    return null;
  }
  if (!cachedID) {
    return attachments[0];
  }
  return attachments.find((a) => a.itemID === cachedID) ?? attachments[0];
};

const cacheActiveAtch = (docItem: RegularItemInfo, atchID: number) =>
  window.localStorage.setItem(toLocalStorageKey(docItem), atchID.toString());

const getInit = (): Pick<
  DataModel,
  | "doc"
  | "tags"
  | "annotations"
  | "attachment"
  | "allAttachments"
  | "attachmentID"
> => ({
  doc: null,
  allAttachments: null,
  attachmentID: null,
  annotations: null,
  attachment: null,
  tags: {},
});

const api = (p: ZoteroPlugin) => p.databaseAPI;

export type StoreAPI = ReturnType<typeof createStore>;

export const createStore = (p: ZoteroPlugin) =>
  create<DataModel>((set, get) => {
    /**
     * @param docItem if provided, load active attachment from localStorage
     */
    const loadAtchs = async (itemID: number, lib: number) => {
        const attachments = (await api(p).getAttachments(itemID, lib)).filter(
          isFileAttachment,
        );
        set((state) => ({
          ...state,
          allAttachments: attachments,
          attachment: getActiveAttachment(state.attachmentID, attachments),
        }));
      },
      loadDocTags = async (itemID: number, lib: number) => {
        const docTags = await api(p).getTags([itemID], lib);
        set((state) => ({ ...state, tags: docTags }));
        return docTags;
      },
      loadAnnots = async (lib: number) => {
        const { attachment } = get();
        if (!attachment) return;
        const annotations = await api(p).getAnnotations(attachment.itemID, lib);
        set((state) => ({ ...state, annotations, attachment }));
        const annotTags = await api(p).getTags(
          annotations.map((a) => a.itemID),
          lib,
        );
        set((state) => ({ ...state, tags: { ...state.tags, ...annotTags } }));
        return { annotations, annotTags };
      };
    return {
      ...getInit(),
      // setFile: (sourcePath: string) => set((state) => ({ ...state, sourcePath })),
      loadDocItem: async (file, lib, force = false) => {
        if (!file) return set(getInit());
        const curr = get();
        if (
          (curr.doc?.docItem.key === file.itemKey ||
            (curr.doc?.sourcePath === file.path && !force)) &&
          !force
        )
          return;
        const item = await api(p).getItem(file.itemKey, lib);
        if (!item) return set(getInit());
        const doc = { sourcePath: file.path, docItem: item, lib };
        const attachmentID = getCachedActiveAtch(item);
        set({ ...getInit(), doc, attachmentID });
        await loadAtchs(item.itemID, lib);
        await loadDocTags(item.itemID, lib);
        await loadAnnots(lib);
      },
      refresh: async () => {
        const { doc, attachment } = get();
        if (!doc) return;
        const { docItem, lib } = doc;
        await loadAtchs(docItem.itemID, lib);
        await loadDocTags(docItem.itemID, lib);
        if (!attachment) return;
        await loadAnnots(lib);
      },
      setActiveAtch: (id) => {
        const { doc, allAttachments } = get();
        if (!doc) return;
        cacheActiveAtch(doc.docItem, id);
        if (!allAttachments) {
          set((state) => ({ ...state, attachment: null, attachmentID: id }));
        } else {
          const activeAtch = getActiveAttachment(id, allAttachments);
          set((state) => ({
            ...state,
            attachment: activeAtch,
            attachmentID: id,
          }));
        }
      },
    };
  });
