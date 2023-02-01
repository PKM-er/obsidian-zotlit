import type { CSSProperties } from "react";
import { forwardRef, memo } from "react";
import type { Attributes } from "../utils";
import { cn } from "../utils";
import { useIconRef, mergeRefs } from "./utils";

export interface IconProps extends Attributes {
  icon: string;
  size?: string | number;
}

export default memo(
  forwardRef(function Icon(
    { icon, size, className, ...props }: IconProps,
    ref: React.Ref<HTMLDivElement>,
  ) {
    const setIconRef = useIconRef(icon, size);
    const myRef = mergeRefs(setIconRef, ref);

    return <div ref={myRef} className={cn("zt-icon", className)} {...props} />;
  }),
);
