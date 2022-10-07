import cls from "classnames";
import { useAtomValue } from "jotai";
import { ItemDetails } from "../item-view/item-details";
import { annotAtom, useShowDetails } from "./atom";

export const AnnotDetailsView = () => {
  const annot = useAtomValue(annotAtom);
  const [showingDetails] = useShowDetails();

  return (
    <div
      className={cls("annot-details", {
        showing: showingDetails,
      })}
    >
      <ItemDetails item={annot} />
    </div>
  );
};
