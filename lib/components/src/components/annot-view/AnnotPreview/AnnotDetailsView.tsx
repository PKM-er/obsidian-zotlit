import clsx from "clsx";
import { ItemDetails } from "../ItemView";

interface AnnotDetailsViewProps {
  showDetails: boolean;
  helper: any;
}

export default function AnnotDetailsView({
  showDetails,
  helper,
}: AnnotDetailsViewProps) {
  return (
    <div
      className={clsx("annot-details", {
        showing: showDetails,
      })}
    >
      <ItemDetails item={helper} />
    </div>
  );
}
