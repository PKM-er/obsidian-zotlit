import type { HTMLAttributes, ImgHTMLAttributes } from "react";

export type Attributes<T = HTMLDivElement> = T extends HTMLImageElement
  ? Omit<ImgHTMLAttributes<T>, "color">
  : Omit<HTMLAttributes<T>, "color">;
