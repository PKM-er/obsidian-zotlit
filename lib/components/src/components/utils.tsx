import type { HTMLAttributes, ImgHTMLAttributes } from "react";
import { useMemo, useContext } from "react";
import { ObsidianContext } from "./obsidian";

export type Attributes<T = HTMLDivElement> = T extends HTMLImageElement
  ? Omit<ImgHTMLAttributes<T>, "color">
  : Omit<HTMLAttributes<T>, "color">;

export const useRawHtml = (html: string) => {
  const { sanitize } = useContext(ObsidianContext);
  return useMemo(
    () => ({
      dangerouslySetInnerHTML: { __html: sanitize(html) },
    }),
    [html, sanitize],
  );
};
