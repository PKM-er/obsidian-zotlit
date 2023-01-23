import type { IconToggleProps } from "../../icon";
import { IconToggle } from "../../icon";

export interface CollapseButtonProps extends Omit<IconToggleProps, "icon"> {
  isCollapsed: boolean;
}

export default function CollapseButton({
  isCollapsed,
  ...props
}: CollapseButtonProps) {
  return (
    <IconToggle
      {...props}
      icon={isCollapsed ? "chevrons-up-down" : "chevrons-down-up"}
      aria-label={isCollapsed ? "Expand" : "Collapse"}
    />
  );
}
