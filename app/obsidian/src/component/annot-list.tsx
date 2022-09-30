import "./style.less";

import type { Annotation } from "@obzt/zotero-type";
import cls from "classnames";
import type { Atom } from "jotai";
import { useAtom, atom, useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import { AnnotationPreview } from "./annot-preview";
import type { AnnotProps } from "./atoms";
import {
  selectedAnnotsAtom,
  latestAnnotsAtom,
  selectedItemsAtom,
} from "./atoms";
import { getIsSelectedAtom } from "./derived-atom";

const weakAtomFamily = <Param extends object, AtomType extends Atom<unknown>>(
  initializeAtom: (param: Param) => AtomType,
) => {
  const atoms = new WeakMap<Param, AtomType>();
  return (obj: Param) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (atoms.has(obj)) return atoms.get(obj)!;
    const newAtom = initializeAtom(obj);
    atoms.set(obj, newAtom);
    return newAtom;
  };
};

const annotAtomFamily = weakAtomFamily((annot: Annotation) => atom(annot));

const filterAtom = atom("all");

const filteredAtom = atom((get) => {
  const filter = get(filterAtom);
  const annots = get(latestAnnotsAtom);
  const selected = get(selectedItemsAtom);
  if (filter === "all") return annots;
  else if (filter === "selected") {
    return get(selectedAnnotsAtom);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return annots.filter((annot) => !selected.has(annot.itemID!));
  }
});

const AnnotationList = ({ selectable = false }: { selectable?: boolean }) => {
  const annots = useAtomValue(filteredAtom);
  return (
    <div className="annot-list">
      <Refresh />
      {annots.map((annot) => (
        <AnnotListItem
          selectable={selectable}
          annot={annot}
          key={annot.itemID}
        />
      ))}
    </div>
  );
};
export default AnnotationList;

const Refresh = () => {
  const refresh = useSetAtom(latestAnnotsAtom);
  return <button onClick={refresh}>Refresh</button>;
};

const AnnotListItem = ({
  annot,
  selectable,
}: {
  annot: Annotation;
  selectable: boolean;
}) => {
  const annotAtom = annotAtomFamily(annot);
  const { itemID } = useAtomValue(annotAtom);
  return itemID !== null ? (
    <div
      key={itemID}
      className={cls("annot-list-item")}
      role="menuitem"
      tabIndex={0}
    >
      {selectable && <SelectCheckbox annotAtom={annotAtom} />}
      <AnnotationPreview annotAtom={annotAtom} />
    </div>
  ) : null;
};

const SelectCheckbox = ({ annotAtom }: AnnotProps) => {
  const isSelectedAtom = useMemo(
    () => getIsSelectedAtom(annotAtom),
    [annotAtom],
  );
  const [selected, setSelected] = useAtom(isSelectedAtom);
  return <input type="checkbox" checked={selected} onChange={setSelected} />;
};
