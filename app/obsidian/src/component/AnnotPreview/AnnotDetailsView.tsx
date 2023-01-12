import clsx from "clsx";
import { withAnnotHelper } from "../../template/helper/annot";
import { ItemDetails } from "../ItemView";
import type { AnnotHelperArgs } from "./hooks/useAnnotHelperArgs";

interface AnnotDetailsViewProps {
  showDetails: boolean;
  renderArgs: AnnotHelperArgs;
}

export default function AnnotDetailsView({
  showDetails,
  renderArgs,
}: AnnotDetailsViewProps) {
  return (
    <div
      className={clsx("annot-details", {
        showing: showDetails,
      })}
    >
      <ItemDetails item={withAnnotHelper(...renderArgs)} />
    </div>
  );
}
