import type { IconToggleProps } from "../icon";
import { IconToggle } from "../icon";

export type DetailsToggleProps = Omit<IconToggleProps, "icon">;

export default function DetailsToggle(props: DetailsToggleProps) {
  return (
    <IconToggle
      icon="info"
      aria-label={`${props.active ? "Hide" : "Show"} details`}
      {...props}
    />
  );
}
