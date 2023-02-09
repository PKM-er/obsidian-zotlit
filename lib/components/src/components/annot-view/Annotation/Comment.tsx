import { memo } from "react";
import type { Attributes } from "@c/utils";
import { cn as clsx, useRawHtml } from "@c/utils";

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
