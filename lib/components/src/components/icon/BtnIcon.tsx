import { forwardRef, memo } from "react";
import type { Attributes } from "@c/utils";
import { useIconRef, mergeRefs } from "./utils";

export interface IconProps extends Attributes<HTMLButtonElement> {
  icon: string;
}

export default memo(
  forwardRef(function Icon(
    { icon, ...props }: IconProps,
    ref: React.Ref<HTMLDivElement>,
  ) {
    const setIconRef = useIconRef(icon);
    return <button ref={mergeRefs(setIconRef, ref)} {...props} />;
  }),
);
