import clsx from "clsx";
import { memo } from "react";
import { renderHTMLReact } from "../../utils";
import type { Attributes } from "../utils";

interface CommentProp extends Attributes {
  content: string;
}

export default memo(function Comment({
  content,
  className,
  ...props
}: CommentProp) {
  return (
    <div className={clsx("annot-comment", className)} {...props}>
      <p {...renderHTMLReact(content)} />
    </div>
  );
});
