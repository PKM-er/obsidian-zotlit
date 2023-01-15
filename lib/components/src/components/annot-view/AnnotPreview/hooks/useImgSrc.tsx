import type { AnnotationInfo } from "@obzt/database";
import { getCacheImagePath } from "@obzt/database";
import { useContext } from "react";
import { Obsidian } from "../../context";

export const useImgSrc = (annot: AnnotationInfo): string | undefined => {
  const { getZoteroDataDir } = useContext(Obsidian);
  return `app://local${getCacheImagePath(annot, getZoteroDataDir())}`;
};
