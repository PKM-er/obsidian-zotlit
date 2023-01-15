import { IconToggle } from "../icon";

export interface CollapseButtonProps {
  isCollapsed: boolean;
  onCollapsedToggled: () => void;
}

export default function CollapseButton({
  isCollapsed,
  onCollapsedToggled,
}: CollapseButtonProps) {
  return (
    <IconToggle
      icon={isCollapsed ? "chevrons-up-down" : "chevrons-down-up"}
      aria-label={isCollapsed ? "Expand" : "Collapse"}
      onClick={onCollapsedToggled}
    />
  );
}
