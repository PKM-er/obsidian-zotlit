import React, { forwardRef } from "react";
import type { Attributes } from "@c/utils";
import { cn as clsx } from "@c/utils";

export type ContentProps = Attributes;
export default forwardRef(function Content(
  { className, ...props }: ContentProps,
  ref: React.Ref<HTMLDivElement>,
) {
  return (
    <div ref={ref} className={clsx("annot-excerpt", className)} {...props} />
  );
});
