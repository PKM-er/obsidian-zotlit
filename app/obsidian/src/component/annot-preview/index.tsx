import type { Annotation } from "@obzt/zotero-type";
import cls from "classnames";
import { Provider, useAtomValue } from "jotai";
import { renderHTMLReact } from "../../utils";
import { useSelector } from "../atoms/derived.js";
import { pluginAtom } from "../atoms/obsidian";
import { createInitialValues } from "../atoms/utils";
import { AnnotDetailsView } from "./annot-details";
import { annotAtom, useIsSelected } from "./atom";
import Content from "./content";
import Header from "./header.jsx";
import { Tags } from "./tags";

export const AnnotationPreview = () => {
  return (
    <div className="annot-preview">
      <Header />
      <Content />
      <Comment />
      <Tags />
      <AnnotDetailsView />
    </div>
  );
};

const Comment = () => {
  const comment = useSelector(annotAtom, ({ comment }) => comment);
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
  const initial = createInitialValues();
  initial.set(annotAtom, data);
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
