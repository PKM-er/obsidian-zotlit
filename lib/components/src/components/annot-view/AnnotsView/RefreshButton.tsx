import { IconToggle } from "../icon";

export interface RefreshButtonProps {
  onRefresh: () => void;
}

export default function RefreshButton({ onRefresh }: RefreshButtonProps) {
  return (
    <IconToggle
      icon="refresh-ccw"
      aria-label="Refresh Annotation List"
      aria-label-delay="50"
      onClick={onRefresh}
    />
  );
}
