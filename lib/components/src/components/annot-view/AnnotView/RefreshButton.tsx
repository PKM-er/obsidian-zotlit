import type { IconToggleProps } from "../../icon";
import { IconToggle } from "../../icon";

export type RefreshButtonProps = Omit<IconToggleProps, "icon">;

export default function RefreshButton(props: RefreshButtonProps) {
  return (
    <IconToggle
      {...props}
      icon="refresh-ccw"
      aria-label="Refresh annotation list"
      aria-label-delay="50"
    />
  );
}
