import type { AnnotationInfo } from "@obzt/database";
import { useContext, useMemo } from "react";
import { Context } from "../../context";

export const useImgSrc = (annot: AnnotationInfo): string | undefined => {
  const { getImgSrc } = useContext(Context);
  return useMemo(() => getImgSrc(annot), [annot, getImgSrc]);
};
