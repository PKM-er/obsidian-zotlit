import cls from "classnames";
import { useAtomValue } from "jotai";
import type { AnnotProps } from "../atoms/annotation";
import { useShowDetails } from "../atoms/annotation";
import { ItemDetails } from "../item-view/item-details";

export const AnnotDetailsView = ({ annotAtom }: AnnotProps) => {
  const annot = useAtomValue(annotAtom);
  const [showingDetails] = useShowDetails(annotAtom);

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
