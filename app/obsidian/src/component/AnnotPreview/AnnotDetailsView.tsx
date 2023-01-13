import clsx from "clsx";
import { withAnnotHelper } from "../../template/helper";
import { ItemDetails } from "../ItemView";
import type { AnnotHelperArgsPartial } from "./hooks/useAnnotHelperArgs";

interface AnnotDetailsViewProps {
  showDetails: boolean;
  renderArgs: AnnotHelperArgsPartial;
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
