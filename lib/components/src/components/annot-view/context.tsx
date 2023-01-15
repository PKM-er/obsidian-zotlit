import type {
  AnnotationInfo,
  TagInfo,
  AttachmentInfo,
  RegularItemInfoBase,
} from "@obzt/database";
import { createContext } from "react";
import type { GetItemString, LabelRenderer } from "react-json-tree";
import type { StoreAPI } from "./store";

export interface ObsidianContext {
  store: StoreAPI;
  sanitize(html: string): string;
  refreshConn(): Promise<void>;
  setIcon(parent: HTMLElement, iconId: string): void;
  getZoteroDataDir(): string;
  getAnnotTextRenderer(
    annotation: AnnotationInfo,
    extra: {
      tags: Record<number, TagInfo[]>;
      attachment: AttachmentInfo;
      allAttachments: AttachmentInfo[];
      annotations: AnnotationInfo[];
      docItem: RegularItemInfoBase;
    },
    sourcePath: string,
  ): (() => string) | null;
  buildAnnotHelper(
    annotation: AnnotationInfo,
    tags: Record<number, TagInfo[]>,
    attachment: AttachmentInfo,
    sourcePath: string,
  ): AnnotationInfo | null;
  buildDocItemHelper(
    item: RegularItemInfoBase,
    tags: Record<number, TagInfo[]>,
    attachment: AttachmentInfo | null,
    sourcePath: string,
    allAttachments: AttachmentInfo[],
  ): RegularItemInfoBase;
  onDragStart(
    evt: React.DragEvent<HTMLDivElement>,
    render: (() => string) | null,
    container: HTMLDivElement | null,
  ): any;
  onMoreOptions(
    evt: React.MouseEvent | React.KeyboardEvent,
    annotation: AnnotationInfo,
  ): any;
  registerCssChange(callback: () => void): () => void;
  registerDbUpdate(callback: () => void): () => void;
  itemDetailsProps: {
    getItemString: GetItemString;
    labelRenderer: LabelRenderer;
  };
}

export const Obsidian = createContext({} as ObsidianContext);
