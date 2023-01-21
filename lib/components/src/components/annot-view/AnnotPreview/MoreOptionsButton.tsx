import clsx from "clsx";
import { IconButton } from "../icon";
import type { IconButtonProps } from "../icon";

export type MoreOptionsButton = Omit<IconButtonProps, "icon">;

export default function MoreOptionsButton({
  className,
  ...props
}: MoreOptionsButton) {
  return (
    <IconButton
      icon="more-vertical"
      // icon size patched in index.css
      className={clsx("annot-header-more-options", className)}
      aria-label="More Options"
      aria-label-delay="50"
      {...props}
    />
  );
}
