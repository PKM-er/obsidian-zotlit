import type { Annotation } from "@obzt/zotero-type";
import { atom, useAtomValue } from "jotai";
import { createPortal } from "react-dom";
import AnnotationList from "@component/annot-list";
import { selectedAnnotsAtom } from "@component/atoms/annotation";

export const buttonContainerAtom = atom<HTMLDivElement>(null as never);

export const AnnotationImport = ({
  onSelectDone,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectDone?: (items: Annotation[]) => any;
}) => {
  const annots = useAtomValue(selectedAnnotsAtom);
  const buttonContainer = useAtomValue(buttonContainerAtom);
  return (
    <>
      <AnnotationList selectable />
      {annots &&
        createPortal(
          <button className="mod-cta" onClick={() => onSelectDone?.(annots)}>
            Import
          </button>,
          buttonContainer,
        )}
    </>
  );
};
