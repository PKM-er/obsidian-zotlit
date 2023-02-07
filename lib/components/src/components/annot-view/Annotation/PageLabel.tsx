import clsx from "clsx";
import { memo } from "react";
import type { Attributes } from "../../utils";

export interface PageLabelProps {
  pageLabel: string | null;
  backlink?: string;
}

export default memo(function PageLabel({
  pageLabel,
  backlink,
  className,
  ...props
}: PageLabelProps & Attributes<HTMLElement>) {
  const page = pageLabel ? `Page ${pageLabel}` : "";

  if (backlink)
    return (
      <a
        className={clsx(
          "annot-page",
          "external-link",
          "bg-[length:12px] bg-[center_right_3px] pr-[18px] text-sm",
          className,
        )}
        href={backlink}
        aria-label={`Open Annotation In Zotero at Page ${pageLabel}`}
        aria-label-delay="500"
        {...props}
      >
        {page}
      </a>
    );
  else return <span className={clsx("annot-page", className)}>{page}</span>;
});
