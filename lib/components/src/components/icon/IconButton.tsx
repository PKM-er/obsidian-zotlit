import { forwardRef } from "react";
import { cn as clsx } from "@c/utils";
import type { IconProps } from "./Icon";
import Icon from "./Icon";

export type IconButtonProps = Omit<IconProps, "onClick"> & {
  onClick?: (evt: React.MouseEvent | React.KeyboardEvent) => any;
};

export default forwardRef(function IconButton(
  { onClick, onKeyDown, className, ...props }: IconButtonProps,
  ref: React.Ref<HTMLDivElement>,
) {
  return (
    <Icon
      onClick={onClick}
      onKeyDown={onKeyDown ?? onClick}
      className={clsx("clickable-icon", className)}
      {...props}
      ref={ref}
      role="button"
      tabIndex={0}
    />
  );
});
