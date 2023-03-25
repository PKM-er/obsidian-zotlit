import { memo, useContext, useMemo } from "react";
import { ObsidianContext } from "@c/obsidian";
import type { Attributes } from "@c/utils";
import { cn as clsx } from "@c/utils";

interface CommentProp extends Attributes {
  content: string;
}

export default memo(function Comment({
  content,
  className,
  ...props
}: CommentProp) {
  const { sanitize, renderMarkdown } = useContext(ObsidianContext);
  const markdown = useMemo(
    () =>
      sanitize(content)
        .replace(/<\/?b>/g, "**")
        .replace(/<\/?i>/g, "*"),
    [content, sanitize],
  );
  return (
    <div
      className={clsx(
        "annot-comment select-text overflow-x-auto break-words px-2 py-1",
        className,
      )}
      {...props}
    >
      {renderMarkdown(markdown)}
    </div>
  );
});
