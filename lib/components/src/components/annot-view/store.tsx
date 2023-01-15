import type {
  AnnotationInfo,
  AttachmentInfo,
  RegularItemInfo,
  TagInfo,
} from "@obzt/database";
import type { StoreApi } from "zustand";

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

export type StoreAPI = StoreApi<DataModel>;
