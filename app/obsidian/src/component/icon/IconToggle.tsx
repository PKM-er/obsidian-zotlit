import clsx from "clsx";
import { forwardRef } from "react";
import type { IconProps } from "./BtnIcon";
import BtnIcon from "./BtnIcon";

export interface IconToggleProps extends IconProps {
  active?: boolean;
}

export default forwardRef(function IconToggle(
  { className, active = false, ...props }: IconToggleProps,
  ref: React.Ref<HTMLDivElement>,
) {
  return (
    <BtnIcon
      {...props}
      ref={ref}
      className={clsx("clickable-icon", { "is-active": active }, className)}
    />
  );
});
