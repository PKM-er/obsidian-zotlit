import type {
  AnnotationInfo,
  AttachmentInfo,
  RegularItemInfoBase,
  TagInfo,
} from "@obzt/database";
import type { StoreApi } from "zustand";

export interface DataModel {
  doc: { docItem: RegularItemInfoBase; lib: number } | null;
  attachment: AttachmentInfo | null;
  attachmentID: number | null;
  allAttachments: AttachmentInfo[] | null;
  annotations: AnnotationInfo[] | null;
  tags: Record<number, TagInfo[]>;
  loadDocItem(
    itemId: number,
    attachmentId: number,
    lib: number,
    force?: boolean,
  ): Promise<void>;
  refresh: () => Promise<void>;
  setActiveAtch: (id: number) => void;
  follow: "zt-reader" | "ob-note" | null;
  setFollow: (follow: DataModel["follow"]) => void;
}

export type StoreAPI = StoreApi<DataModel>;
