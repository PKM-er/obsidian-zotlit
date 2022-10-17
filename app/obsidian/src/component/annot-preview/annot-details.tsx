import cls from "classnames";
import { ItemDetails } from "../item-view/item-details";
import { useAnnotValue, useShowDetails } from "./atom";

export const AnnotDetailsView = () => {
  const annot = useAnnotValue();
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
