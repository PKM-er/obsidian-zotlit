import type { Attributes } from "../utils";

interface ImgExcerptProps extends Attributes<HTMLImageElement> {
  text: string | null;
  pageLabel: string | null;
}

export default function ImgExcerpt({
  text,
  pageLabel,
  ...props
}: ImgExcerptProps) {
  const alt = text ?? `Area Excerpt for Page ${pageLabel ?? "?"}`;
  return <img alt={alt} {...props} />;
}
