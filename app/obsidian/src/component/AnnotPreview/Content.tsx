import clsx from "clsx";
import React, { forwardRef } from "react";
import type { Attributes } from "../utils";

export type ContentProps = Attributes;
export default forwardRef(function Content(
  { className, ...props }: ContentProps,
  ref: React.Ref<HTMLDivElement>,
) {
  return (
    <div ref={ref} className={clsx("annot-excerpt", className)} {...props} />
  );
});
