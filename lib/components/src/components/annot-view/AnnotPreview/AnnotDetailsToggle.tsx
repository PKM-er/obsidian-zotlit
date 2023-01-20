import clsx from "clsx";
import type { DetailsToggleProps } from "../DetailsToggle";
import DetailsToggle from "../DetailsToggle";

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
