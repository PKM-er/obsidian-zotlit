import type { IconButtonProps } from "./icon";
import { IconButton } from "./icon";

export type DetailsToggleProps = Omit<IconButtonProps, "icon">;

export default function DetailsToggle(props: DetailsToggleProps) {
  return <IconButton icon="info" aria-label="Show details" {...props} />;
}
