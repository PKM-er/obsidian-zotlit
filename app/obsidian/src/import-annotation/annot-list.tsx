import { sortBySortIndex } from "@obzt/database";
import type { Annotation } from "@obzt/zotero-type";
import cls from "classnames";
import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { createPortal } from "react-dom";
import { useImmer } from "use-immer";
import { AnnotationPreview } from "./annot-preview";

export const AnnotationContext = createContext<{
  zoteroDataDir: string;
  buttonContainer: HTMLDivElement;
}>({} as never);

export const AnnotationList = ({
  annotations,
  onSelectDone,
}: {
  annotations: Annotation[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectDone?: (items: Annotation[]) => any;
}) => {
  const [annots, setAnnots] = useImmer(
    annotations
      .sort((a, b) => sortBySortIndex(a.sortIndex, b.sortIndex))
      .map((a, i) => ({ ...a, selected: false, index: i })),
  );
  const { buttonContainer } = useContext(AnnotationContext);
  return (
    <>
      <div className="annot-list">
        {annots.map((annot) => {
          const onChecked = () =>
            setAnnots((annots) => {
              const { index } = annot;
              annots[index].selected = !annots[index].selected;
            });
          return (
            <div
              key={annot.itemID}
              className={cls("annot-list-item", { selected: annot.selected })}
              role="menuitem"
              onClick={onChecked}
              onKeyPress={onChecked}
              tabIndex={0}
            >
              <AnnotationPreview annotation={annot} />
            </div>
          );
        })}
      </div>
      {createPortal(
        <>
          <button
            className="mod-cta"
            onClick={() =>
              onSelectDone?.(annots.filter(({ selected }) => selected))
            }
          >
            Import
          </button>
        </>,
        buttonContainer,
      )}
    </>
  );
};
