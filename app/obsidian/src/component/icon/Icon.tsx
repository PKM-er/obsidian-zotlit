import { forwardRef, memo } from "react";
import type { Attributes } from "../utils";
import { useIconRef, mergeRefs } from "./utils";

export interface IconProps extends Attributes {
  icon: string;
}

export default memo(
  forwardRef(function Icon(
    { icon, ...props }: IconProps,
    ref: React.Ref<HTMLDivElement>,
  ) {
    const setIconRef = useIconRef(icon);
    return <div ref={mergeRefs(setIconRef, ref)} {...props} />;
  }),
);
