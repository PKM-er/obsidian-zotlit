import clsx from "clsx";
import { withAnnotHelper } from "../../template/helper/annot";
import { ItemDetails } from "../item-view/item-details";
import { useAnnotHelperArgs, useShowDetails } from "./atom";

export const AnnotDetailsView = () => {
  const [showingDetails] = useShowDetails();
  const args = useAnnotHelperArgs();
  if (args)
    return (
      <div
        className={clsx("annot-details", {
          showing: showingDetails,
        })}
      >
        <ItemDetails item={withAnnotHelper(...args)} />
      </div>
    );
  else return null;
};
