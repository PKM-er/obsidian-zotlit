import clsx from "clsx";
import { memo } from "react";
import type { Attributes } from "../utils";
import { useRawHtml } from "../utils";

interface CommentProp extends Attributes {
  content: string;
}

export default memo(function Comment({
  content,
  className,
  ...props
}: CommentProp) {
  const html = useRawHtml(content);
  return (
    <div className={clsx("annot-comment", className)} {...props}>
      <p {...html} />
    </div>
  );
});
