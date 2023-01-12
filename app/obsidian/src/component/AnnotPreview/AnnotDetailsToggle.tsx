import clsx from "clsx";
import type { DetailsToggleProps } from "../ItemView";
import { DetailsToggle } from "../ItemView";

type AnnotDetailsToggleProps = DetailsToggleProps;

export default function AnnotDetailsToggle({
  className,
  ...props
}: AnnotDetailsToggleProps) {
  return (
    <DetailsToggle
      className={clsx("annot-header-details-toggle", className)}
      {...props}
    />
  );
}
