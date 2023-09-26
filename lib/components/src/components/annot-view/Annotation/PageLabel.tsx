import { memo } from "react";
import type { Attributes } from "@c/utils";
import { cn as clsx } from "@c/utils";

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
          "bg-[length:12px] bg-[center_right_3px] pr-[18px] text-xs",
          className,
        )}
        href={backlink}
        aria-label={`Open annotation in Zotero at page ${pageLabel}`}
        aria-label-delay="500"
        {...props}
      >
        {page}
      </a>
    );
  else return <span className={clsx("annot-page", className)}>{page}</span>;
});
