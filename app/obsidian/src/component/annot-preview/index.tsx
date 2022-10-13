import type { AttachmentInfo } from "@obzt/database";
import type { Annotation } from "@obzt/zotero-type";
import cls from "classnames";
import { Provider, useAtomValue } from "jotai";
import { Suspense, useRef } from "react";
import type {
  AnnotationWithTags,
  WithFileContext,
} from "../../note-template/const";
import { renderHTMLReact } from "../../utils";
import { useSelector } from "../atoms/derived.js";
import { pluginAtom } from "../atoms/obsidian";
import { createInitialValues } from "../atoms/utils";
import { AnnotDetailsView } from "./annot-details";
import { annotBaseAtom, useIsSelected } from "./atom";
import Content from "./content";
import Header from "./header.jsx";
import { Tags } from "./tags";

export type DragHandler = (
  e: React.DragEvent<HTMLDivElement>,
  annot: Omit<AnnotationWithTags, "attachment">,
) => void;

export const AnnotationPreview = ({ onDrag }: { onDrag: DragHandler }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  return (
    <div className="annot-preview">
      <Header dragRef={contentRef} onDrag={onDrag} />
      <Content ref={contentRef} />
      <Comment />
      <Suspense fallback={null}>
        <Tags />
      </Suspense>
      <AnnotDetailsView />
    </div>
  );
};

const Comment = () => {
  const comment = useSelector(annotBaseAtom, ({ comment }) => comment);
  return comment ? (
    <div className="annot-comment">
      <p {...renderHTMLReact(comment)} />
    </div>
  ) : null;
};

export const AnnotListItem = ({
  data,
  selectable,
  onDrag,
}: {
  data: Annotation;
  onDrag: DragHandler;
  selectable: boolean;
}) => {
  const initial = createInitialValues();
  initial.set(annotBaseAtom, data);
  initial.set(pluginAtom, useAtomValue(pluginAtom));
  return (
    <Provider initialValues={initial.get()}>
      <div
        key={data.itemID}
        className={cls("annot-list-item")}
        role="menuitem"
        tabIndex={0}
      >
        {selectable && <SelectCheckbox />}
        <AnnotationPreview onDrag={onDrag} />
      </div>
    </Provider>
  );
};

const SelectCheckbox = () => {
  const [selected, setSelected] = useIsSelected();
  return (
    <input
      type="checkbox"
      checked={selected}
      onChange={() => setSelected((prev) => !prev)}
    />
  );
};
