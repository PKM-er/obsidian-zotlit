import type { AnnotationInfo } from "@obzt/database";
import { useContext } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import { Obsidian } from "../../context";

export const useAnnotHelper = (
  annotation: AnnotationInfo,
): AnnotationInfo | null => {
  const { buildAnnotHelper } = useContext(Obsidian);
  const { store } = useContext(Obsidian);
  const args = useStore(
    store,
    (s) => {
      if (
        !s.attachment ||
        !s.doc ||
        !s.annotations ||
        !s.tags[annotation.itemID]
      ) {
        return null;
      }
      return [s.tags, s.attachment, s.doc?.sourcePath] as const;
    },
    shallow,
  );
  if (!args) return null;
  return buildAnnotHelper(annotation, ...args);
};

export const useAnnotRenderer = (
  annotation: AnnotationInfo,
): (() => string) | null => {
  const { getAnnotTextRenderer } = useContext(Obsidian);
  const { store } = useContext(Obsidian);
  const args = useStore(
    store,
    (s) => {
      if (!s.attachment || !s.doc || !s.allAttachments) {
        return null;
      }
      return [
        {
          tags: s.tags,
          attachment: s.attachment,
          allAttachments: s.allAttachments,
          annotations: s.annotations ?? [],
          docItem: s.doc.docItem,
        },
        s.doc.sourcePath,
      ] as const;
    },
    shallow,
  );

  if (!args) return null;
  return getAnnotTextRenderer(annotation, ...args);
};
