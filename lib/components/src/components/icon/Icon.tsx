import { forwardRef, memo } from "react";
import type { Attributes } from "../utils";
import { useIconRef, mergeRefs } from "./utils";

export interface IconProps extends Attributes {
  icon: string;
  size?: string | number;
}

export default memo(
  forwardRef(function Icon(
    { icon, size, ...props }: IconProps,
    ref: React.Ref<HTMLDivElement>,
  ) {
    const setIconRef = useIconRef(icon);
    return (
      <div
        style={
          size &&
          ({
            "--icon-size": typeof size === "number" ? `${size}px` : size,
          } as any)
        }
        ref={mergeRefs(setIconRef, ref)}
        {...props}
      />
    );
  }),
);
