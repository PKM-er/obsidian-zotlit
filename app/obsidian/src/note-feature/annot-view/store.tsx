import type { AnnotViewStore } from "@obzt/components";
import { createStore as create } from "@obzt/components";
import type { AttachmentInfo } from "@obzt/database";
import {
  cacheActiveAtch,
  getCachedActiveAtch,
  isAnnotatableAttachment,
} from "@obzt/database";
import { mergeAnnots, mergeTags, mergedToAnnots } from "@/utils/merge";
import type ZoteroPlugin from "@/zt-main";

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

type PickNonFunctionKeys<T extends Record<string, any>> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [P in keyof T]: T[P] extends Function ? never : P;
}[keyof T];
type PickNonFunction<T extends Record<string, any>> = Pick<
  T,
  PickNonFunctionKeys<T>
>;

export type AnnotViewStoreValues = PickNonFunction<AnnotViewStore>;

const getInitData = (): Partial<AnnotViewStoreValues> => ({
  doc: null,
  allAttachments: null,
  attachmentID: null,
  annotations: null,
  attachment: null,
  tags: {},
});

const getInit = (): AnnotViewStoreValues => ({
  follow: "zt-reader",
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
  create<AnnotViewStore>((set, get) => {
    /**
     * @param docItem if provided, load active attachment from localStorage
     */
    const loadAtchs = async (itemID: number, lib: number) => {
        const attachments = (await api(p).getAttachments(itemID, lib)).filter(
          isAnnotatableAttachment,
        );
        set((state) => ({
          ...state,
          allAttachments: attachments,
          attachment: getActiveAttachment(state.attachmentID, attachments),
        }));
      },
      loadDocTags = async (itemID: number, lib: number) => {
        const docTags = await api(p).getTags([[itemID, lib]]);
        set((state) => ({ ...state, tags: docTags }));
        return docTags;
      },
      loadAnnots = async (lib: number) => {
        const { attachment } = get();
        if (!attachment) return;
        const annotations = await api(p).getAnnotations(attachment.itemID, lib);
        const mergedAnnots = mergeAnnots(annotations);
        set((state) => ({
          ...state,
          annotations: mergedToAnnots(mergedAnnots),
          attachment,
        }));
        const annotTags = await api(p).getTags(
          annotations.map((a) => [a.itemID, lib]),
        );
        const mergedAnnotTags = mergeTags(mergedAnnots, annotTags);
        set((state) => ({
          ...state,
          tags: { ...state.tags, ...mergedAnnotTags },
        }));
      };
    return {
      ...getInit(),
      loadDocItem: async (itemId, atchId, lib, force = false) => {
        if (itemId < 0) return set(getInitData());
        if (get().doc?.docItem.itemID === itemId && !force) return;
        const item = (await api(p).getItems([[itemId, lib]]))[0];
        if (!item) return set(getInitData());
        const doc = { docItem: item, lib };
        if (atchId < 0) {
          const attachmentID = getCachedActiveAtch(window.localStorage, item);
          set({ ...getInitData(), doc, attachmentID });
        } else {
          cacheActiveAtch(window.localStorage, item, atchId);
          set({ ...getInitData(), doc, attachmentID: atchId });
        }
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
        cacheActiveAtch(window.localStorage, doc.docItem, id);
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
      setFollow: (follow) => set({ follow }),
    };
  });
