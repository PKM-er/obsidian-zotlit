import type { Attributes } from "@c/utils";
import { cn as clsx } from "@c/utils";

interface ImgExcerptProps extends Attributes<HTMLImageElement> {
  text: string | null;
  pageLabel: string | null;
  collapsed?: boolean;
}

export default function ImgExcerpt({
  text,
  pageLabel,
  className,
  collapsed = false,
  ...props
}: ImgExcerptProps) {
  const alt = text ?? `Area Excerpt for Page ${pageLabel ?? "?"}`;
  return (
    <img
      className={clsx(
        "w-full",
        collapsed
          ? "max-h-20 object-cover object-left-top"
          : "object-scale-down",
        className,
      )}
      alt={alt}
      {...props}
    />
  );
}
