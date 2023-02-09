import { forwardRef, memo } from "react";
import { cn } from "@c/utils";
import type { Attributes } from "@c/utils";
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
