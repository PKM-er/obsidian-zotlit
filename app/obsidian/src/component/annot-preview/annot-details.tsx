import clsx from "clsx";
import { ItemDetails } from "../item-view/item-details";
import { useAnnotValue, useShowDetails } from "./atom";

export const AnnotDetailsView = () => {
  const annot = useAnnotValue();
  const [showingDetails] = useShowDetails();
  return (
    <div
      className={clsx("annot-details", {
        showing: showingDetails,
      })}
    >
      <ItemDetails item={annot} />
    </div>
  );
};
