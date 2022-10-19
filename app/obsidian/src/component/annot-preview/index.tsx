import type { Annotation } from "@obzt/zotero-type";
import clsx from "clsx";
import { atom, Provider, useAtomValue, useSetAtom } from "jotai";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { renderHTMLReact } from "@utils";
import { createInitialValues } from "@utils/create-initial";
import type { AnnotationWithTags } from "../../note-template/const";
import { useSelector } from "../atoms/derived.js";
import { pluginAtom } from "../atoms/obsidian";
import { GLOBAL_SCOPE } from "../atoms/utils";
import { AnnotDetailsView } from "./annot-details";
import { annotAtomAtom, ANNOT_PREVIEW_SCOPE, useIsSelected } from "./atom";
import Content from "./content";
import Header from "./header.jsx";
import { Tags } from "./tags";

export type DragHandler = (
  e: React.DragEvent<HTMLDivElement>,
  annot: Omit<AnnotationWithTags, "attachment">,
) => void;

export const AnnotationPreview = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  return (
    <div className="annot-preview">
      <Header dragRef={contentRef} />
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
  const comment = useSelector(({ comment }) => comment);
  return comment ? (
    <div className="annot-comment">
      <p {...renderHTMLReact(comment)} />
    </div>
  ) : null;
};

export const AnnotListItem = ({
  data,
  selectable,
}: {
  data: Annotation;
  selectable: boolean;
}) => {
  // create local atom that will update when props.data changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const myAtom = useMemo(() => atom(data), []);
  const updateAtom = useSetAtom(myAtom);
  useEffect(() => updateAtom(data), [data, updateAtom]);

  const initial = createInitialValues();
  initial.set(annotAtomAtom, myAtom);
  initial.set(pluginAtom, useAtomValue(pluginAtom, GLOBAL_SCOPE));
  return (
    <Provider initialValues={initial.get()} scope={ANNOT_PREVIEW_SCOPE}>
      <div
        key={data.itemID}
        className={clsx("annot-list-item")}
        role="menuitem"
        tabIndex={0}
      >
        {selectable && <SelectCheckbox />}
        <AnnotationPreview />
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
